from datetime import datetime, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import JWTError, jwt
import bcrypt
from pydantic import BaseModel, EmailStr
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.config import settings, is_admin_email
from backend.database import AsyncSessionLocal
from backend.models.student import Student

router = APIRouter()

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

def hash_password(password: str) -> str:
    """Hash password using bcrypt"""
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, password_hash: str) -> bool:
    """Verify password against hash"""
    return bcrypt.checkpw(password.encode('utf-8'), password_hash.encode('utf-8'))

class RegisterRequest(BaseModel):
    name: str
    email: EmailStr
    password: str
    class_level: str
    medium: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"

class StudentResponse(BaseModel):
    id: str
    name: str
    email: EmailStr
    class_level: str
    medium: str
    exam_date: Optional[str]
    is_admin: bool = False

async def get_db() -> AsyncSession:
    async with AsyncSessionLocal() as session:
        yield session

async def get_current_student(token: str = Depends(oauth2_scheme), db: AsyncSession = Depends(get_db)) -> Student:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.jwt_secret, algorithms=["HS256"])
        student_id: str = payload.get("sub")
        if student_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    result = await db.execute(select(Student).where(Student.id == student_id))
    student = result.scalar_one_or_none()
    if student is None:
        raise credentials_exception
    return student

@router.post("/register", response_model=StudentResponse)
async def register(request: RegisterRequest, db: AsyncSession = Depends(get_db)) -> StudentResponse:
    existing = await db.execute(select(Student).where(Student.email == request.email))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email already registered")
    password_hash = hash_password(request.password)
    student = Student(
        id=str(datetime.utcnow().timestamp()).replace('.', ''),
        name=request.name,
        email=request.email,
        password_hash=password_hash,
        class_level=request.class_level,
        medium=request.medium,
    )
    db.add(student)
    await db.commit()
    await db.refresh(student)
    return StudentResponse(
        id=student.id,
        name=student.name,
        email=student.email,
        class_level=student.class_level,
        medium=student.medium,
        exam_date=student.exam_date.isoformat() if student.exam_date else None,
        is_admin=is_admin_email(student.email),
    )

@router.post("/login", response_model=TokenResponse)
async def login(form_data: OAuth2PasswordRequestForm = Depends(), db: AsyncSession = Depends(get_db)) -> TokenResponse:
    result = await db.execute(select(Student).where(Student.email == form_data.username))
    student = result.scalar_one_or_none()
    if not student or not verify_password(form_data.password, student.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    expire = datetime.utcnow() + timedelta(minutes=settings.jwt_expire_minutes)
    token = jwt.encode({"sub": student.id, "exp": expire}, settings.jwt_secret, algorithm="HS256")
    return TokenResponse(access_token=token)

@router.get("/me", response_model=StudentResponse)
async def read_me(current_student: Student = Depends(get_current_student)) -> StudentResponse:
    return StudentResponse(
        id=current_student.id,
        name=current_student.name,
        email=current_student.email,
        class_level=current_student.class_level,
        medium=current_student.medium,
        exam_date=current_student.exam_date.isoformat() if current_student.exam_date else None,
        is_admin=is_admin_email(current_student.email),
    )
