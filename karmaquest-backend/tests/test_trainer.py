"""
Test cases for Trainer routes
Tests: /api/trainer/* endpoints
"""
import pytest
from datetime import datetime, timedelta


class TestGetAssignedClients:
    """Test trainer viewing assigned clients"""
    
    def test_trainer_can_view_assigned_clients(self, client, db, trainer_headers, trainer_with_clients):
        """Test trainer can view their assigned clients"""
        trainer, clients = trainer_with_clients
        
        response = client.get('/api/trainer/clients',
            headers=trainer_headers
        )
        
        assert response.status_code == 200
        data = response.get_json()
        assert data['success'] is True


class TestGetClientPerformance:
    """Test trainer viewing client performance"""
    
    def test_trainer_can_view_client_performance(self, client, db, trainer_headers, trainer_with_clients):
        """Test trainer can view assigned client's performance"""
        trainer, clients = trainer_with_clients
        client_id = clients[0].user_id
        
        from app.models.workout import WorkoutSession
        for i in range(5):
            session = WorkoutSession(
                user_id=client_id,
                session_date=datetime.utcnow() - timedelta(days=i),
                duration_seconds=1800,
                total_exercises=3,
                total_reps=30,
                total_calories=250,
                avg_posture_score=85.0
            )
            db.session.add(session)
        db.session.commit()
        
        response = client.get(f'/api/trainer/clients/{client_id}/performance',
            headers=trainer_headers
        )
        
        assert response.status_code == 200
        data = response.get_json()
        assert data['success'] is True
