"""
Pytest configuration and fixtures for KarmaQuest backend tests
"""
import pytest
import os
from app import create_app, db as _db
from app.models.user import User, UserProfile
from app.models.workout import WorkoutSession, ExerciseLog
from app.models.plan import WeeklyWorkoutPlan, WeeklyMealPlan
from datetime import datetime, timedelta
from flask_jwt_extended import create_access_token


@pytest.fixture(scope='session')
def app():
    """Create application for testing with test configuration"""
    # Set test environment variables
    os.environ['DATABASE_URL'] = os.getenv('TEST_DATABASE_URL', 'sqlite:///:memory:')
    os.environ['JWT_SECRET_KEY'] = 'test-jwt-secret-key'
    os.environ['SECRET_KEY'] = 'test-secret-key'
    
    app = create_app('development')
    app.config.update({
        'TESTING': True,
        'SQLALCHEMY_DATABASE_URI': 'sqlite:///:memory:',
        'JWT_SECRET_KEY': 'test-jwt-secret-key',
        'SECRET_KEY': 'test-secret-key',
        'WTF_CSRF_ENABLED': False,
    })
    
    return app


@pytest.fixture(scope='function')
def db(app):
    """Create database for testing"""
    with app.app_context():
        _db.create_all()
        yield _db
        _db.session.remove()
        _db.drop_all()


@pytest.fixture
def client(app, db):
    """Create test client"""
    return app.test_client()


@pytest.fixture
def runner(app):
    """Create test CLI runner"""
    return app.test_cli_runner()


# ============================================================================
# User Fixtures
# ============================================================================

@pytest.fixture
def sample_user(db):
    """Create a sample regular user"""
    user = User(
        email='testuser@example.com',
        first_name='Test',
        last_name='User',
        role='user'
    )
    user.set_password('TestPassword123!')
    db.session.add(user)
    db.session.flush()
    
    profile = UserProfile(
        user_id=user.user_id,
        fitness_level='intermediate',
        fitness_goal='general_fitness',
        current_weight=70.0,
        height=175.0
    )
    db.session.add(profile)
    db.session.commit()
    
    return user


@pytest.fixture
def sample_admin(db):
    """Create a sample admin user"""
    admin = User(
        email='admin@karmaquest.com',
        first_name='Admin',
        last_name='User',
        role='admin'
    )
    admin.set_password('admin123')
    db.session.add(admin)
    db.session.flush()
    
    profile = UserProfile(user_id=admin.user_id)
    db.session.add(profile)
    db.session.commit()
    
    return admin


@pytest.fixture
def sample_trainer(db):
    """Create a sample trainer user"""
    trainer = User(
        email='trainer@example.com',
        first_name='John',
        last_name='Trainer',
        role='trainer',
        trainer_specialization='Strength Training and Weight Loss'
    )
    trainer.set_password('TrainerPass123!')
    db.session.add(trainer)
    db.session.flush()
    
    profile = UserProfile(user_id=trainer.user_id)
    db.session.add(profile)
    db.session.commit()
    
    return trainer


@pytest.fixture
def multiple_users(db):
    """Create multiple users for testing"""
    users = []
    for i in range(5):
        user = User(
            email=f'user{i}@example.com',
            first_name=f'User{i}',
            last_name='Test',
            role='user'
        )
        user.set_password('Password123!')
        db.session.add(user)
        db.session.flush()
        
        profile = UserProfile(user_id=user.user_id)
        db.session.add(profile)
        users.append(user)
    
    db.session.commit()
    return users


# ============================================================================
# Authentication Fixtures
# ============================================================================

@pytest.fixture
def auth_headers(app, sample_user):
    """Get JWT auth headers for regular user"""
    with app.app_context():
        access_token = create_access_token(identity=sample_user.user_id)
        return {'Authorization': f'Bearer {access_token}'}


@pytest.fixture
def admin_headers(app, sample_admin):
    """Get JWT auth headers for admin user"""
    with app.app_context():
        access_token = create_access_token(identity=sample_admin.user_id)
        return {'Authorization': f'Bearer {access_token}'}


@pytest.fixture
def trainer_headers(app, sample_trainer):
    """Get JWT auth headers for trainer user"""
    with app.app_context():
        access_token = create_access_token(identity=sample_trainer.user_id)
        return {'Authorization': f'Bearer {access_token}'}


# ============================================================================
# Workout Fixtures
# ============================================================================

@pytest.fixture
def sample_workout(db, sample_user):
    """Create a sample workout session"""
    session = WorkoutSession(
        user_id=sample_user.user_id,
        session_date=datetime.utcnow(),
        duration_seconds=1800,
        total_exercises=3,
        total_reps=30,
        total_calories=250,
        avg_posture_score=85.5
    )
    db.session.add(session)
    db.session.commit()
    
    return session


@pytest.fixture
def sample_exercises(db, sample_workout):
    """Create sample exercise logs"""
    exercises = []
    exercise_types = ['squats', 'pushups', 'lunges']
    
    for ex_type in exercise_types:
        exercise = ExerciseLog(
            session_id=sample_workout.session_id,
            exercise_type=ex_type,
            correct_reps=8,
            incorrect_reps=2,
            total_reps=10,
            avg_form_score=85.0,
            duration_seconds=300,
            calories_burned=80
        )
        db.session.add(exercise)
        exercises.append(exercise)
    
    db.session.commit()
    return exercises


@pytest.fixture
def workout_history(db, sample_user):
    """Create workout history for testing plan generation"""
    sessions = []
    for i in range(10):
        session = WorkoutSession(
            user_id=sample_user.user_id,
            session_date=datetime.utcnow() - timedelta(days=i),
            duration_seconds=1800,
            total_exercises=3,
            total_reps=30,
            total_calories=250,
            avg_posture_score=80 + i  # Varying scores
        )
        db.session.add(session)
        sessions.append(session)
    
    db.session.commit()
    return sessions


# ============================================================================
# Plan Fixtures
# ============================================================================

@pytest.fixture
def sample_workout_plan(db, sample_user):
    """Create a sample workout plan"""
    plan = WeeklyWorkoutPlan(
        user_id=sample_user.user_id,
        start_date=datetime.utcnow().date(),
        end_date=(datetime.utcnow() + timedelta(days=7)).date(),
        plan_data={
            'days': [
                {
                    'day': 'Monday',
                    'exercises': [
                        {'name': 'Squats', 'sets': 3, 'reps': 10}
                    ]
                }
            ]
        },
        is_active=True
    )
    db.session.add(plan)
    db.session.commit()
    
    return plan


@pytest.fixture
def sample_meal_plan(db, sample_user):
    """Create a sample meal plan"""
    plan = WeeklyMealPlan(
        user_id=sample_user.user_id,
        start_date=datetime.utcnow().date(),
        end_date=(datetime.utcnow() + timedelta(days=7)).date(),
        plan_data=[
            {
                'day': 'Monday',
                'total_calories': 2000,
                'meals': []
            }
        ],
        total_calories_per_day=2000,
        is_active=True
    )
    db.session.add(plan)
    db.session.commit()
    
    return plan


# ============================================================================
# Trainer-Client Fixtures
# ============================================================================

@pytest.fixture
def trainer_with_clients(db, sample_trainer, multiple_users):
    """Create trainer with assigned clients"""
    # Assign first 3 users to trainer
    client_ids = [user.user_id for user in multiple_users[:3]]
    sample_trainer.assigned_users = client_ids
    db.session.commit()
    
    return sample_trainer, multiple_users[:3]
