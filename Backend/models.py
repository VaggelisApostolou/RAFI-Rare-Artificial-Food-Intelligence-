from sqlalchemy import Column, Integer, String, Float, Date, ForeignKey, Enum as SQLEnum, DateTime
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import enum
from database import Base

class MealTypeEnum(enum.Enum):
    breakfast = "breakfast"
    morning_snack = "morning_snack"
    lunch = "lunch"
    afternoon_snack = "afternoon_snack"
    dinner = "dinner"

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, nullable=False)
    email = Column(String, unique=True, nullable=False)
    password_hash = Column(String, nullable=False)
    created_at = Column(DateTime, server_default=func.now())
    
    daily_logs = relationship("DailyLog", back_populates="user")
    recipes = relationship("Recipe", back_populates="user")


class DailyLog(Base):
    __tablename__ = "daily_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    log_date = Column(Date, nullable=False)
    total_protein_g = Column(Float, default=0.0)
    
    user = relationship("User", back_populates="daily_logs")
    meals = relationship("Meal", back_populates="daily_log")


class Meal(Base):
    __tablename__ = "meals"
    
    id = Column(Integer, primary_key=True, index=True)
    daily_log_id = Column(Integer, ForeignKey("daily_logs.id", ondelete="CASCADE"))
    meal_type = Column(SQLEnum(MealTypeEnum, name="meal_type_enum"), nullable=False)
    calories = Column(Float, nullable=False, default=0.0)
    protein_g = Column(Float, nullable=False, default=0.0)
    created_at = Column(DateTime, server_default=func.now())
    
    daily_log = relationship("DailyLog", back_populates="meals")

class Recipe(Base):
    __tablename__ = "recipes"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    name = Column(String, nullable=False)
    calories = Column(Float, nullable=False)
    protein_g = Column(Float, nullable=False, default=0.0)
    created_at = Column(DateTime, server_default=func.now())
    
    user = relationship("User", back_populates="recipes")