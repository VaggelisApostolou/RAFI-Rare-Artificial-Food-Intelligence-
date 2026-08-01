from pydantic import BaseModel, EmailStr
from datetime import datetime, date
from models import MealTypeEnum 
from typing import List, Optional
from pydantic import computed_field

class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str

class UserUpdate(BaseModel):
    username: str | None = None
    email: str | None = None
    password: str | None = None

class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    created_at: datetime
    class Config:
        from_attributes = True

class MealCreate(BaseModel):
    meal_type: MealTypeEnum
    calories: float
    protein_g: float

class MealResponse(BaseModel):
    id: int
    daily_log_id: int
    meal_type: MealTypeEnum
    calories: float
    protein_g: float
    created_at: datetime
    class Config:
        from_attributes = True

class DailyLogCreate(BaseModel):
    user_id: int
    log_date: date
    total_protein_g: float = 0.0

class DailyLogResponse(BaseModel):
    id: int
    user_id: int
    log_date: date
    total_protein_g: float
    meals: list[MealResponse] = [] 
    
    @computed_field
    def total_calories(self) -> float:
        return sum(meal.calories for meal in self.meals)

    @computed_field
    def display_protein(self) -> float:
        meals_protein = sum(meal.protein_g for meal in self.meals)
        return meals_protein if meals_protein > 0 else self.total_protein_g

    class Config:
        from_attributes = True

class RecipeCreate(BaseModel):
    name: str
    calories: float
    protein_g: float

class RecipeResponse(BaseModel):
    id: int
    user_id: int
    name: str
    calories: float
    protein_g: float
    created_at: datetime
    
    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str
    user_id: int 

class TokenData(BaseModel):
    email: str | None = None