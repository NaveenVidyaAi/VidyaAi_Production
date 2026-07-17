from datetime import datetime, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, Form, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import JWTError, jwt
import bcrypt
from pydantic import BaseModel

from backend.config import settings, is_admin_email
from backend.database import AsyncSessionLocal

router = APIRouter()

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


class Student:
    def __init__(self, student_id: str, name: str = "Guest", email: str = "guest@vidyaai.local", class_level: str = "10", medium: str = "Hindi", is_admin: bool = False, role: str = "student") -> None:
        self.id = student_id
        self.name = name
        self.email = email
        self.class_level = class_level
        self.medium = medium
        self.exam_date = None
        self.is_admin = is_admin
        self.role = role if role in {"student", "teacher"} else "student"

def hash_password(password: str) -> str:
    """Hash password using bcrypt"""
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, password_hash: str) -> bool:
    """Verify password against hash"""
    return bcrypt.checkpw(password.encode('utf-8'), password_hash.encode('utf-8'))

class RegisterRequest(BaseModel):
    name: str
    email: str
    password: str
    class_level: str
    medium: str
    role: str = "student"

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str = "student"

class StudentResponse(BaseModel):
    id: str
    name: str
    email: str
    class_level: str
    medium: str
    exam_date: Optional[str]
    is_admin: bool = False
    role: str = "student"

async def get_db():
    if AsyncSessionLocal is None:
        yield None
        return

    async with AsyncSessionLocal() as session:
        yield session

async def get_current_student(token: str = Depends(oauth2_scheme), db=Depends(get_db)) -> Student:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.jwt_secret, algorithms=["HS256"])
        student_id: str | None = payload.get("sub")
        if student_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    email = payload.get("email") or student_id or "guest@vidyaai.local"
    name = payload.get("name") or (email.split("@", 1)[0] if email else "Student")
    class_level = payload.get("class_level") or "10"
    medium = payload.get("medium") or "Hindi"
    is_admin = bool(payload.get("is_admin", False))
    role = payload.get("role") if payload.get("role") in {"student", "teacher"} else "student"

    return Student(
        student_id=str(student_id),
        name=name,
        email=email,
        class_level=class_level,
        medium=medium,
        is_admin=is_admin,
        role=role,
    )

@router.post("/register", response_model=StudentResponse)
async def register(request: RegisterRequest) -> StudentResponse:
    return StudentResponse(
        id="local-user",
        name=request.name,
        email=request.email,
        class_level=request.class_level,
        medium=request.medium,
        exam_date=None,
        is_admin=is_admin_email(request.email),
        role=request.role if request.role in {"student", "teacher"} else "student",
    )

@router.post("/login", response_model=TokenResponse)
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    role: str = Form(default="student"),
) -> TokenResponse:
    email = form_data.username or "guest@vidyaai.local"
    name = email.split("@", 1)[0].replace(".", " ").title() if email else "Student"
    is_admin = is_admin_email(email)
    selected_role = role if role in {"student", "teacher"} else "student"
    expire = datetime.utcnow() + timedelta(minutes=settings.jwt_expire_minutes)
    payload = {
        "sub": email,
        "email": email,
        "name": name,
        "class_level": "10",
        "medium": "Hindi",
        "is_admin": is_admin,
        "role": selected_role,
        "exp": expire,
    }
    token = jwt.encode(payload, settings.jwt_secret, algorithm="HS256")
    return TokenResponse(access_token=token, role=selected_role)

@router.get("/me", response_model=StudentResponse)
async def read_me(current_student: Student = Depends(get_current_student)) -> StudentResponse:
    return StudentResponse(
        id=current_student.id,
        name=current_student.name,
        email=current_student.email,
        class_level=current_student.class_level,
        medium=current_student.medium,
        exam_date=current_student.exam_date.isoformat() if current_student.exam_date else None,
        is_admin=current_student.is_admin,
        role=current_student.role,
    )
