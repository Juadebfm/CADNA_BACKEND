// Client-side token management for exam sessions
export class ExamTokenManager {
  constructor(apiClient) {
    this.apiClient = apiClient;
    this.refreshInterval = null;
    this.examSessionId = null;
  }

  // Start auto-refresh during exam
  startExamTokenRefresh(sessionId) {
    this.examSessionId = sessionId;
    
    // Refresh every 30 minutes during exam
    this.refreshInterval = setInterval(async () => {
      try {
        const response = await this.apiClient.post('/api/auth/extend-exam-token', {
          sessionId: this.examSessionId
        });
        
        if (response.data.success) {
          // Update token in storage
          localStorage.setItem('accessToken', response.data.data.accessToken);
          console.log('Exam token refreshed successfully');
        }
      } catch (error) {
        console.error('Failed to refresh exam token:', error);
      }
    }, 30 * 60 * 1000); // 30 minutes
  }

  // Stop auto-refresh when exam ends
  stopExamTokenRefresh() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
      this.examSessionId = null;
    }
  }

  // Manual token refresh
  async refreshExamToken() {
    if (!this.examSessionId) return false;
    
    try {
      const response = await this.apiClient.post('/api/auth/extend-exam-token', {
        sessionId: this.examSessionId
      });
      
      if (response.data.success) {
        localStorage.setItem('accessToken', response.data.data.accessToken);
        return true;
      }
    } catch (error) {
      console.error('Manual token refresh failed:', error);
    }
    
    return false;
  }
}