import os
import tempfile
import logging
from django.shortcuts import render
from django.http import JsonResponse
from .tasks import process_log
from django.middleware.csrf import get_token


logger = logging.getLogger(__name__)

def upload_log(request):
    if request.method == 'POST':
        log_file = request.FILES.get('log_file')
        if not log_file:
            return JsonResponse({'error': 'No file uploaded'}, status=400)

        try:
            # Save file to /tmp or some safe path
            temp_dir = tempfile.gettempdir()
            os.makedirs(temp_dir, exist_ok=True)
            file_path = os.path.join(temp_dir, log_file.name)
            
            # Save the uploaded file
            with open(file_path, 'wb+') as destination:
                for chunk in log_file.chunks():
                    destination.write(chunk)

            # Get file size for priority calculation
            file_size = os.path.getsize(file_path)
            logger.info(f"File {log_file.name} uploaded, size: {file_size} bytes")

            # Launch Celery task with filename
            task = process_log.delay(file_path, log_file.name, file_size)
            
            return JsonResponse({
                'task_id': str(task.id),
                'file_name': log_file.name,
                'file_size': file_size,
                'message': 'File uploaded. Processing in background.'
            })

        except Exception as e:
            logger.error(f"Error processing log file: {e}", exc_info=True)
            return JsonResponse({'error': f'Error processing file: {str(e)}'}, status=500)

    return render(request, 'upload_form.html')


def get_csrf_token(request):
    token = get_token(request)
    response = JsonResponse({'csrfToken': token})
    response.set_cookie("csrftoken", token, httponly=False, secure=True, samesite="None")
    return response
    # return JsonResponse({'csrfToken': token})
