"""
Role-based access control decorators for Flask routes
"""

from functools import wraps
from flask import jsonify
from flask_jwt_extended import verify_jwt_in_request, get_jwt


def admin_required():
    """
    Decorator to protect routes that require admin access.
    Verifies JWT and checks if the user has 'admin' role.
    """
    def wrapper(fn):
        @wraps(fn)
        def decorator(*args, **kwargs):
            verify_jwt_in_request()
            claims = get_jwt()
            if claims.get('role') != 'admin':
                return jsonify({
                    'success': False, 
                    'error': 'Admin access required'
                }), 403
            return fn(*args, **kwargs)
        return decorator
    return wrapper


def trainer_required():
    """
    Decorator to protect routes that require trainer access.
    Verifies JWT and checks if the user has 'trainer' or 'admin' role.
    """
    def wrapper(fn):
        @wraps(fn)
        def decorator(*args, **kwargs):
            verify_jwt_in_request()
            claims = get_jwt()
            if claims.get('role') not in ['trainer', 'admin']:
                return jsonify({
                    'success': False, 
                    'error': 'Trainer access required'
                }), 403
            return fn(*args, **kwargs)
        return decorator
    return wrapper


def user_or_trainer_required():
    """
    Decorator for routes accessible by users and trainers (not admin only).
    Verifies JWT and checks if the user has 'user' or 'trainer' role.
    """
    def wrapper(fn):
        @wraps(fn)
        def decorator(*args, **kwargs):
            verify_jwt_in_request()
            claims = get_jwt()
            if claims.get('role') not in ['user', 'trainer', 'admin']:
                return jsonify({
                    'success': False, 
                    'error': 'Access denied'
                }), 403
            return fn(*args, **kwargs)
        return decorator
    return wrapper
