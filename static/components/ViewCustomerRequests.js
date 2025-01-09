export default {
  name: "ViewCustomerRequests",
  data() {
    return {
      requests: [],
      loading: true,
    };
  },
  created() {
    this.fetchRequests();
  },
  methods: {
    async fetchRequests() {
      try {
        const userId = localStorage.getItem('id'); // Retrieve the User ID from localStorage
        if (!userId) {
          throw new Error('User ID is missing in localStorage.');
        }
    
        // Make the fetch request with the User-Id header
        const response = await fetch('/api/prof/all-requests', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'User-Id': userId, // Pass the User ID in the headers
          },
        });
    
        console.log('Response status:', response.status); // Log the status code for debugging
        if (!response.ok) {
          throw new Error(`Network response was not ok, status: ${response.status}`);
        }
        console.log('Headers:', {
          'User-Id': localStorage.getItem('id'),
        });
    
        // Parse the response JSON and set it to the component state
        this.requests = await response.json();
      } catch (error) {
        console.error('Error fetching requests:', error);
      } finally {
        this.loading = false;
      }
    },
    
    
    async acceptRequest(requestId) {
      try {
        const response = await fetch(`/api/service-requests/${requestId}/accept`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        });
        if (response.ok) {
          this.updateRequestStatus(requestId, 'accepted');
        } else {
          console.error("Failed to accept request");
        }
      } catch (error) {
        console.error("Error accepting request:", error);
      }
    },
    async rejectRequest(requestId) {
      try {
        const response = await fetch(`/api/service-requests/${requestId}/reject`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        });
        if (response.ok) {
          this.updateRequestStatus(requestId, 'rejected');
        } else {
          console.error("Failed to reject request");
        }
      } catch (error) {
        console.error("Error rejecting request:", error);
      }
    },
    async closeRequest(requestId) {
      try {
        const response = await fetch(`/api/service-requests/${requestId}/close`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        });
        if (response.ok) {
          this.updateRequestStatus(requestId, 'closed');
        } else {
          console.error("Failed to close request");
        }
      } catch (error) {
        console.error("Error closing request:", error);
      }
    },
    updateRequestStatus(requestId, newStatus) {
      const request = this.requests.find(req => req.id === requestId);
      if (request) request.status = newStatus;
    },
    formatDate(date) {
      return new Date(date).toLocaleDateString();
    },
    statusClass(status) {
      switch (status) {
        case 'requested':
          return 'text-warning';
        case 'accepted':
          return 'text-success';
        case 'rejected':
          return 'text-danger';
        case 'closed':
          return 'text-muted';
        default:
          return '';
      }
    }
  },
  template: `
  <div>
    <h2>Customer Service Requests</h2>
    <div v-if="loading" class="loading">Loading...</div>
    <div v-else>
      <div v-for="request in requests" :key="request.id" class="card request-card mb-3">
        <!-- Card Header -->
        <div class="card-header">
          <h5 class="card-title">Service Request: {{ request.service_name }}</h5>
        </div>
        
        <!-- Card Body -->
        <div class="card-body">
          <p><strong>Customer:</strong> {{ request.customer_name }}</p>
          <p><strong>Requested Date:</strong> {{ formatDate(request.date_of_request) }}</p>
          <p><strong>Status:</strong> <span :class="statusClass(request.status)">{{ request.status }}</span></p>
        </div>

        <!-- Card Footer with Action Buttons -->
        <div class="card-footer">
          <button 
            v-if="request.status === 'requested'"
            @click="acceptRequest(request.id)"
            class="btn btn-success me-2"
          >
            Accept
          </button>
          <button 
            v-if="request.status === 'requested'"
            @click="rejectRequest(request.id)"
            class="btn btn-danger me-2"
          >
            Reject
          </button>
          <button 
            v-if="request.status === 'accepted'"
            @click="closeRequest(request.id)"
            class="btn btn-primary"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  </div>
  `
};
