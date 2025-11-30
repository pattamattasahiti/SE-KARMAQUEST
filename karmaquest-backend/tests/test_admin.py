"""
Test cases for Admin routes
Tests: /api/admin/* endpoints
"""
import pytest


class TestCreateTrainer:
    """Test admin creating trainer accounts"""
    
    def test_admin_can_create_trainer(self, client, db, admin_headers):
        """Test admin can create a trainer account"""
        response = client.post('/api/admin/trainers',
            headers=admin_headers,
            json={
                'email': 'newtrainer@example.com',
                'password': 'TrainerPass123!',
                'first_name': 'New',
                'last_name': 'Trainer',
                'specialization': 'Yoga and Flexibility'
            }
        )
        
        assert response.status_code == 201
        data = response.get_json()
        assert data['success'] is True
        assert data['data']['role'] == 'trainer'


class TestListUsers:
    """Test admin listing all users"""
    
    def test_admin_can_list_all_users(self, client, db, admin_headers, multiple_users):
        """Test admin can list all users"""
        response = client.get('/api/admin/users',
            headers=admin_headers
        )
        
        assert response.status_code == 200
        data = response.get_json()
        assert data['success'] is True
