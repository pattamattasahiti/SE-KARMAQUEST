"""
Test cases for Authentication routes
Tests: /api/auth/register, /api/auth/login, /api/auth/logout, /api/auth/refresh-token
"""
import pytest
from app.models.user import User


class TestUserRegistration:
    """Test user registration endpoint"""
    
    def test_register_with_valid_data(self, client, db):
        """Test successful user registration"""
        response = client.post('/api/auth/register', json={
            'email': 'newuser@example.com',
            'password': 'SecurePass123!',
            'first_name': 'New',
            'last_name': 'User'
        })
        
        assert response.status_code == 201
        data = response.get_json()
        assert data['success'] is True
        assert 'access_token' in data['data']
        assert 'refresh_token' in data['data']
        assert data['data']['user']['email'] == 'newuser@example.com'
        assert data['data']['user']['role'] == 'user'
        assert 'profile' in data['data']
    
    def test_register_with_duplicate_email(self, client, db, sample_user):
        """Test registration with existing email should fail"""
        response = client.post('/api/auth/register', json={
            'email': 'testuser@example.com',  # Already exists
            'password': 'SecurePass123!',
            'first_name': 'Duplicate',
            'last_name': 'User'
        })
        
        assert response.status_code == 400
        data = response.get_json()
        assert data['success'] is False
        assert 'already registered' in data['error'].lower()
    
    def test_register_with_missing_email(self, client, db):
        """Test registration without email should fail"""
        response = client.post('/api/auth/register', json={
            'password': 'SecurePass123!',
            'first_name': 'Test',
            'last_name': 'User'
        })
        
        assert response.status_code == 500
        data = response.get_json()
        assert data['success'] is False
    
    def test_register_with_missing_password(self, client, db):
        """Test registration without password should fail"""
        response = client.post('/api/auth/register', json={
            'email': 'test@example.com',
            'first_name': 'Test',
            'last_name': 'User'
        })
        
        assert response.status_code == 500
        data = response.get_json()
        assert data['success'] is False
    
    def test_register_creates_profile(self, client, db):
        """Test that registration automatically creates user profile"""
        response = client.post('/api/auth/register', json={
            'email': 'profiletest@example.com',
            'password': 'SecurePass123!',
            'first_name': 'Profile',
            'last_name': 'Test'
        })
        
        assert response.status_code == 201
        data = response.get_json()
        assert 'profile' in data['data']
        assert data['data']['profile']['user_id'] == data['data']['user']['user_id']


class TestUserLogin:
    """Test user login endpoint"""
    
    def test_login_with_correct_credentials(self, client, db, sample_user):
        """Test successful login with correct credentials"""
        response = client.post('/api/auth/login', json={
            'email': 'testuser@example.com',
            'password': 'TestPassword123!'
        })
        
        assert response.status_code == 200
        data = response.get_json()
        assert data['success'] is True
        assert 'access_token' in data['data']
        assert 'refresh_token' in data['data']
        assert data['data']['user']['email'] == 'testuser@example.com'
        assert data['data']['role'] == 'user'
    
    def test_login_with_incorrect_password(self, client, db, sample_user):
        """Test login with wrong password should fail"""
        response = client.post('/api/auth/login', json={
            'email': 'testuser@example.com',
            'password': 'WrongPassword123!'
        })
        
        assert response.status_code == 401
        data = response.get_json()
        assert data['success'] is False
        assert 'invalid credentials' in data['error'].lower()
    
    def test_login_with_nonexistent_email(self, client, db):
        """Test login with non-existent email should fail"""
        response = client.post('/api/auth/login', json={
            'email': 'nonexistent@example.com',
            'password': 'SomePassword123!'
        })
        
        assert response.status_code == 401
        data = response.get_json()
        assert data['success'] is False
    
    def test_login_updates_last_login(self, client, db, sample_user):
        """Test that login updates last_login timestamp"""
        original_last_login = sample_user.last_login
        
        response = client.post('/api/auth/login', json={
            'email': 'testuser@example.com',
            'password': 'TestPassword123!'
        })
        
        assert response.status_code == 200
        db.session.refresh(sample_user)
        assert sample_user.last_login != original_last_login


class TestAdminLogin:
    """Test admin-specific login functionality"""
    
    def test_admin_login_with_hardcoded_credentials(self, client, db):
        """Test admin can login with hardcoded credentials"""
        response = client.post('/api/auth/login', json={
            'email': 'admin@karmaquest.com',
            'password': 'admin123'
        })
        
        assert response.status_code == 200
        data = response.get_json()
        assert data['success'] is True
        assert data['data']['role'] == 'admin'
        assert data['data']['user']['email'] == 'admin@karmaquest.com'
    
    def test_admin_auto_creation_on_first_login(self, client, db):
        """Test admin user is created automatically on first login"""
        # Ensure admin doesn't exist
        admin = User.query.filter_by(email='admin@karmaquest.com').first()
        if admin:
            db.session.delete(admin)
            db.session.commit()
        
        response = client.post('/api/auth/login', json={
            'email': 'admin@karmaquest.com',
            'password': 'admin123'
        })
        
        assert response.status_code == 200
        
        # Verify admin was created
        admin = User.query.filter_by(email='admin@karmaquest.com').first()
        assert admin is not None
        assert admin.role == 'admin'


class TestTokenRefresh:
    """Test JWT token refresh endpoint"""
    
    def test_refresh_token_with_valid_refresh_token(self, client, db, sample_user):
        """Test token refresh with valid refresh token"""
        # First login to get refresh token
        login_response = client.post('/api/auth/login', json={
            'email': 'testuser@example.com',
            'password': 'TestPassword123!'
        })
        
        refresh_token = login_response.get_json()['data']['refresh_token']
        
        # Use refresh token to get new access token
        response = client.post('/api/auth/refresh-token', headers={
            'Authorization': f'Bearer {refresh_token}'
        })
        
        assert response.status_code == 200
        data = response.get_json()
        assert data['success'] is True
        assert 'access_token' in data['data']
        assert 'refresh_token' in data['data']
    
    def test_refresh_token_without_token(self, client, db):
        """Test refresh endpoint without token should fail"""
        response = client.post('/api/auth/refresh-token')
        
        assert response.status_code == 401


class TestLogout:
    """Test logout endpoint"""
    
    def test_logout_with_valid_token(self, client, db, auth_headers):
        """Test successful logout"""
        response = client.post('/api/auth/logout', headers=auth_headers)
        
        assert response.status_code == 200
        data = response.get_json()
        assert data['success'] is True
    
    def test_logout_without_token(self, client, db):
        """Test logout without token should fail"""
        response = client.post('/api/auth/logout')
        
        assert response.status_code == 401


class TestProtectedEndpoints:
    """Test JWT protection on endpoints"""
    
    def test_protected_endpoint_without_token(self, client, db):
        """Test accessing protected endpoint without token"""
        response = client.get('/api/users/profile')
        
        assert response.status_code == 401
    
    def test_protected_endpoint_with_invalid_token(self, client, db):
        """Test accessing protected endpoint with invalid token"""
        response = client.get('/api/users/profile', headers={
            'Authorization': 'Bearer invalid_token_here'
        })
        
        assert response.status_code == 422  # Unprocessable Entity
    
    def test_protected_endpoint_with_valid_token(self, client, db, auth_headers):
        """Test accessing protected endpoint with valid token"""
        response = client.get('/api/users/profile', headers=auth_headers)
        
        assert response.status_code == 200
