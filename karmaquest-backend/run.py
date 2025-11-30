from app import create_app
import os

app = create_app(os.getenv('FLASK_ENV', 'development'))

# Increase timeout for video processing
# Flask development server has built-in timeout, but we can configure it
# For production, use gunicorn with --timeout 300 option

if __name__ == '__main__':
    # Run with increased timeout for video processing
    # Note: For development server, timeout is handled by werkzeug
    app.run(
        host='0.0.0.0', 
        port=5000, 
        debug=True,
        threaded=True,  # Enable threading for better performance
        request_handler=None  # Use default handler
    )
