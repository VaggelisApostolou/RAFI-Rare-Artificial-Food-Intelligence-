from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from auth import get_password_hash, verify_password, create_access_token, ACCESS_TOKEN_EXPIRE_MINUTES
from datetime import timedelta
from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from datetime import date
from sqlalchemy import extract
from fastapi.middleware.cors import CORSMiddleware
import models
import schemas
import httpx

app = FastAPI(title="RAFI API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  
    allow_credentials=True,
    allow_methods=["*"],  
    allow_headers=["*"],
)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

@app.post("/users/", response_model=schemas.UserResponse)
def create_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Το email χρησιμοποιείται ήδη")
    
    hashed_password = get_password_hash(user.password)
    
    new_user = models.User(
        username=user.username,
        email=user.email,
        password_hash=hashed_password
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    return new_user

@app.put("/users/{user_id}", response_model=schemas.UserResponse)
def update_user(user_id: int, user_update: schemas.UserUpdate, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="Ο χρήστης δεν βρέθηκε")
    
    if user_update.email:
        existing = db.query(models.User).filter(models.User.email == user_update.email, models.User.id != user_id).first()
        if existing:
            raise HTTPException(status_code=400, detail="Το email χρησιμοποιείται ήδη")
        db_user.email = user_update.email
        
    if user_update.username:
        db_user.username = user_update.username
        
    if user_update.password:
        db_user.password_hash = get_password_hash(user_update.password)
        
    db.commit()
    db.refresh(db_user)
    return db_user

@app.post("/login", response_model=schemas.Token)
def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == form_data.username).first()
    
    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=401,
            detail="Λάθος email ή κωδικός πρόσβασης",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    
    return {"access_token": access_token, "token_type": "bearer", "user_id": user.id}

@app.post("/daily_logs/", response_model=schemas.DailyLogResponse)
def create_daily_log(log: schemas.DailyLogCreate, db: Session = Depends(get_db)):
    existing_log = db.query(models.DailyLog).filter(
        models.DailyLog.user_id == log.user_id,
        models.DailyLog.log_date == log.log_date
    ).first()
    
    if existing_log:
        raise HTTPException(status_code=400, detail="Υπάρχει ήδη καταγραφή για αυτή την ημέρα.")
    
    new_log = models.DailyLog(
        user_id=log.user_id,
        log_date=log.log_date,
        total_protein_g=log.total_protein_g
    )
    db.add(new_log)
    db.commit()
    db.refresh(new_log)
    
    return new_log

@app.post("/meals/", response_model=schemas.MealResponse)
def create_meal(daily_log_id: int, meal: schemas.MealCreate, db: Session = Depends(get_db)):
    db_log = db.query(models.DailyLog).filter(models.DailyLog.id == daily_log_id).first()
    if not db_log:
        raise HTTPException(status_code=404, detail="Η ημέρα καταγραφής δεν βρέθηκε.")
        
    existing_meal = db.query(models.Meal).filter(
        models.Meal.daily_log_id == daily_log_id,
        models.Meal.meal_type == meal.meal_type
    ).first()

    if existing_meal:
        existing_meal.calories = meal.calories
        existing_meal.protein_g = meal.protein_g
        db.commit()
        db.refresh(existing_meal)
        return existing_meal
    else:
        new_meal = models.Meal(
            daily_log_id=daily_log_id,
            meal_type=meal.meal_type,
            calories=meal.calories,
            protein_g=meal.protein_g
        )
        db.add(new_meal)
        db.commit()
        db.refresh(new_meal)
        return new_meal
    
@app.get("/daily_logs/{user_id}/{target_date}", response_model=schemas.DailyLogResponse)
def get_daily_log(user_id: int, target_date: date, db: Session = Depends(get_db)):
    db_log = db.query(models.DailyLog).filter(
        models.DailyLog.user_id == user_id,
        models.DailyLog.log_date == target_date
    ).first()
    
    if not db_log:
        raise HTTPException(status_code=404, detail="Δεν βρέθηκε καταγραφή για αυτή την ημερομηνία.")
        
    return db_log

@app.get("/daily_logs/{user_id}/month/{year}/{month}", response_model=list[schemas.DailyLogResponse])
def get_monthly_logs(user_id: int, year: int, month: int, db: Session = Depends(get_db)):
    logs = db.query(models.DailyLog).filter(
        models.DailyLog.user_id == user_id,
        extract('year', models.DailyLog.log_date) == year,
        extract('month', models.DailyLog.log_date) == month
    ).all()
    
    return logs

@app.get("/nutrition/barcode/{barcode}")
async def get_nutrition_by_barcode(barcode: str):
    url = f"https://world.openfoodfacts.org/api/v2/product/{barcode}.json"
    
    async with httpx.AsyncClient() as client:
        response = await client.get(url)
    
    if response.status_code != 200:
        raise HTTPException(status_code=400, detail="Πρόβλημα επικοινωνίας με το Open Food Facts.")
    
    data = response.json()
    
    if data.get("status") != 1:
        raise HTTPException(status_code=404, detail="Το προϊόν δεν βρέθηκε στη βάση δεδομένων.")
        
    product = data.get("product", {})
    nutriments = product.get("nutriments", {})
    
    product_name = product.get("product_name", "Άγνωστο προϊόν")
    calories_100g = nutriments.get("energy-kcal_100g", 0.0)
    protein_100g = nutriments.get("proteins_100g", 0.0)
    
    return {
        "barcode": barcode,
        "product_name": product_name,
        "calories_per_100g": calories_100g,
        "protein_per_100g": protein_100g
    }

@app.post("/recipes/{user_id}", response_model=schemas.RecipeResponse)
def create_recipe(user_id: int, recipe: schemas.RecipeCreate, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="Ο χρήστης δεν βρέθηκε.")
        
    new_recipe = models.Recipe(
        user_id=user_id,
        name=recipe.name,
        calories=recipe.calories,
        protein_g=recipe.protein_g
    )
    db.add(new_recipe)
    db.commit()
    db.refresh(new_recipe)
    
    return new_recipe

@app.get("/recipes/{user_id}", response_model=list[schemas.RecipeResponse])
def get_user_recipes(user_id: int, db: Session = Depends(get_db)):
    recipes = db.query(models.Recipe).filter(models.Recipe.user_id == user_id).all()
    return recipes

@app.delete("/meals/{meal_id}")
def delete_meal(meal_id: int, db: Session = Depends(get_db)):
    db_meal = db.query(models.Meal).filter(models.Meal.id == meal_id).first()
    
    if not db_meal:
        raise HTTPException(status_code=404, detail="Το γεύμα δεν βρέθηκε.")
        
    db.delete(db_meal)
    db.commit()
    
    return {"message": "Το γεύμα διαγράφηκε επιτυχώς"}