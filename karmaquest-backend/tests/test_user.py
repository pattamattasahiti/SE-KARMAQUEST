"""
Test cases for User Profile routes
Tests: /api/users/profile (GET, PUT)
"""
import pytest


class TestGetUserProfile:
    """Test getting user profile"""
    
    def test_get_own_profile(self, client, db, auth_headers, sample_user):
        """Test user can get their own profile"""
        response = client.get('/api/users/profile', headers=auth_headers)
        
        assert response.status_code == 200
        data = response.get_json()
        assert data['success'] is True
        assert data['data']['user']['email'] == 'testuser@example.com'
        assert 'profile' in data['data']
    
    def test_get_profile_without_auth(self, client, db):
        """Test getting profile without authentication should fail"""
        response = client.get('/api/users/profile')
        
        assert response.status_code == 401


class TestUpdateUserProfile:
    """Test updating user profile"""
    
    def test_update_profile_basic_info(self, client, db, auth_headers, sample_user):
        """Test updating basic profile information"""
        response = client.put('/api/users/profile', 
            headers=auth_headers,
            json={
                'first_name': 'Updated',
                'last_name': 'Name'
            }
        )
        
        assert response.status_code == 200
        data = response.get_json()
        assert data['success'] is True
        assert data['data']['user']['first_name'] == 'Updated'
        assert data['data']['user']['last_name'] == 'Name'
    
    def test_update_fitness_profile(self, client, db, auth_headers, sample_user):
        """Test updating fitness profile fields"""
        response = client.put('/api/users/profile',
            headers=auth_headers,
            json={
                'fitness_level': 'advanced',
                'fitness_goal': 'muscle_gain',
                'current_weight': 75.5,
                'target_weight': 80.0,
                'height': 180.0
            }
        )
        
        assert response.status_code == 200
        data = response.get_json()
        assert data['success'] is True
        assert data['data']['profile']['fitness_level'] == 'advanced'
        assert data['data']['profile']['fitness_goal'] == 'muscle_gain'
        assert data['data']['profile']['current_weight'] == 75.5
