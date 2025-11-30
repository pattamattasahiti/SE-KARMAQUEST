"""
Test cases for Progress tracking routes
Tests: /api/progress/* endpoints
"""
import pytest


class TestProgressSummary:
    """Test getting progress summary"""
    
    def test_get_progress_summary(self, client, db, auth_headers, workout_history):
        """Test getting overall progress summary"""
        response = client.get('/api/progress/summary',
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.get_json()
        assert data['success'] is True
        assert 'total_workouts' in data['data']


class TestWeeklyProgress:
    """Test getting weekly progress"""
    
    def test_get_weekly_progress(self, client, db, auth_headers, workout_history):
        """Test getting weekly progress data"""
        response = client.get('/api/progress/weekly',
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.get_json()
        assert data['success'] is True
