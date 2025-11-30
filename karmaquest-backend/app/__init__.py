from flask import Flask
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate

db = SQLAlchemy()
migrate = Migrate()
jwt = JWTManager()

def create_app(config_name='development'):
    from config.config import config
    
    app = Flask(__name__)
    app.config.from_object(config[config_name])
    
    # Initialize extensions
    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    CORS(app)
    
    # Configure JWT to include role in token claims
    @jwt.additional_claims_loader
    def add_claims_to_access_token(identity):
        from app.models.user import User
        user = User.query.get(identity)
        if user:
            return {
                'role': user.role,
                'email': user.email
            }
        return {'role': 'user'}
    
    # Register blueprints
    try:
        from app.routes import auth, user, workout, progress, plan, pose, admin, trainer
        app.register_blueprint(auth.bp, url_prefix='/api/auth')
        app.register_blueprint(user.bp, url_prefix='/api/users')
        app.register_blueprint(workout.bp, url_prefix='/api/workouts')
        app.register_blueprint(progress.bp, url_prefix='/api/progress')
        app.register_blueprint(plan.bp, url_prefix='/api/plans')
        app.register_blueprint(pose.bp, url_prefix='/api/pose')
        app.register_blueprint(admin.bp, url_prefix='/api/admin')
        app.register_blueprint(trainer.bp, url_prefix='/api/trainer')
    except ImportError:
        pass  # Routes will be created
    
    @app.route('/api/health')
    def health_check():
        return {'status': 'healthy', 'message': 'KarmaQuest API is running'}
    
    return app
