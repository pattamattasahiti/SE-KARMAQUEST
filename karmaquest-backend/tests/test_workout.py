"""
Test cases for Workout Session routes
Tests: /api/workouts/sessions/* endpoints
"""
import pytest
from datetime import datetime


class TestStartWorkoutSession:
    """Test starting a new workout session"""
    
    def test_start_session_successfully(self, client, db, auth_headers):
        """Test starting a new workout session"""
        response = client.post('/api/workouts/sessions/start',
            headers=auth_headers,
            json={}
        )
        
        assert response.status_code == 201
        data = response.get_json()
        assert data['success'] is True
        assert 'session' in data['data']
        assert 'session_id' in data['data']['session']


class TestCompleteWorkoutSession:
    """Test completing a workout session"""
    
    def test_complete_session_successfully(self, client, db, auth_headers, sample_workout):
        """Test completing a workout session"""
        response = client.post(
            f'/api/workouts/sessions/{sample_workout.session_id}/complete',
            headers=auth_headers,
            json={
                'duration_seconds': 1800,
                'total_calories': 300
            }
        )
        
        assert response.status_code == 200
        data = response.get_json()
        assert data['success'] is True


class TestGetWorkoutHistory:
    """Test getting workout history"""
    
    def test_get_workout_history(self, client, db, auth_headers, workout_history):
        """Test getting user's workout history"""
        response = client.get('/api/workouts/sessions/history',
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.get_json()
        assert data['success'] is True
        assert len(data['data']) > 0
