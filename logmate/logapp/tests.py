from django.test import TestCase, Client
from django.urls import reverse
from django.core.files.uploadedfile import SimpleUploadedFile
import tempfile
import os
from unittest.mock import patch

class LogAppViewsTest(TestCase):
    def setUp(self):
        self.client = Client()
        self.upload_url = reverse('upload_log')
        self.csrf_url = reverse('get_csrf_token')

    def test_get_csrf_token(self):
        response = self.client.get(self.csrf_url)
        self.assertEqual(response.status_code, 200)
        self.assertTrue('csrfToken' in response.json())

    def test_upload_log_get_request(self):
        response = self.client.get(self.upload_url)
        self.assertEqual(response.status_code, 200)
        self.assertTemplateUsed(response, 'upload_form.html')

    def test_upload_log_no_file(self):
        # Test when no file is uploaded
        response = self.client.post(self.upload_url)
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json(), {'error': 'No file uploaded'})

    @patch('logapp.views.process_log.delay')
    def test_upload_log_successful(self, mock_process_log):
        # Mock the Celery task
        mock_process_log.return_value.id = 'test_task_id'

        # Create a test file
        test_content = b'Test log content'
        test_file = SimpleUploadedFile(
            name='test.log',
            content=test_content,
            content_type='text/plain'
        )

        response = self.client.post(
            self.upload_url, 
            {'log_file': test_file}
        )

        self.assertEqual(response.status_code, 200)
        response_data = response.json()
        self.assertEqual(response_data['task_id'], 'test_task_id')
        self.assertEqual(response_data['file_name'], 'test.log')
        self.assertEqual(response_data['file_size'], len(test_content))


    def test_upload_log_os_error(self):
        # Simulate an OS error by mocking 'os.makedirs'
        test_file = SimpleUploadedFile(
            name='test.log',
            content=b'Test content'
        )

        with patch('os.makedirs', side_effect=OSError("Mocked OS error")):
            response = self.client.post(self.upload_url, {'log_file': test_file})

        self.assertEqual(response.status_code, 500)
        self.assertIn('error', response.json())
        self.assertTrue('Mocked OS error' in response.json()['error'])

    def tearDown(self):
        # Clean up any temporary files
        temp_dir = tempfile.gettempdir()
        for file in os.listdir(temp_dir):
            if file.endswith('.log'):
                try:
                    os.remove(os.path.join(temp_dir, file))
                except:
                    pass