export default {
  
  data() {
    return {
      requests: [],
      token: localStorage.getItem('auth-token'),
      isLoading: true,
      error: null,
    };
  },
 
  computed: {
    filteredRequests() {
      return this.requests.map(request => ({
        ...request,
        statusLower: request.service_request_status.toLowerCase(),
      }));
    }
  },
  async created() {
    await this.fetchRequests();
  },
  methods: {
    async fetchRequests() {
      this.error = null;
      try {
        const res = await fetch('/api/my-requests', {
          method: 'GET',
          headers: {
            "Content-Type": "application/json",
            'Authentication-Token': this.token,
          },
        });
        const data = await res.json();

        if (res.ok) {
          this.requests = data.requests;
        } else {
          this.error = data.message || 'Unable to fetch service requests';
        }
      } catch (error) {
        console.error('Error fetching requests:', error);
        this.error = 'Something went wrong while fetching your requests.';
      } finally {
        this.isLoading = false;
      }
    },

    // Close the request and open the review form
    async closeRequest(requestId) {
      this.error = null;
      try {
        const response = await fetch(`/api/request/close/${requestId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authentication-Token': this.token,
          },
        });
    
        if (response.ok) {
          await this.fetchRequests(); // Refresh the list
        } else {
          this.error = 'Failed to close the request.';
        }
      } catch (error) {
        console.error('Error closing request:', error);
        this.error = 'An error occurred while closing the request.';
      }
    },
    
    // Delete the service request
    async deleteRequest(requestId) {
      this.error = null;
      try {
        const response = await fetch(`/api/request/delete/${requestId}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'Authentication-Token': this.token,
          },
        });

        if (response.ok) {
          // Refresh the requests list after deletion
          await this.fetchRequests();
        } else {
          this.error = 'Failed to delete the request.';
        }
      } catch (error) {
        console.error('Error deleting request:', error);
        this.error = 'An error occurred while deleting the request.';
      }
    },

    editRequest(requestId) {
      this.$router.push({ name: 'EditRequest', params: { id: requestId } });
    },

    statusBadgeClass(status) {
      switch (status) {
        case 'Requested':
          return 'badge badge-requested';
        case 'Accepted':
          return 'badge badge-accepted';
        case 'Closed':
          return 'badge badge-closed';
        default:
          return 'badge badge-pending';
      }
    },

    formatDate(dateString) {
      const options = { year: 'numeric', month: 'long', day: 'numeric' };
      return new Date(dateString).toLocaleDateString(undefined, options);
    },

  },

  template: `
  <div>
    <div class="my-requests-container">
      <h2 class="text-center my-4">My Service Requests</h2>

      <div v-if="isLoading" class="text-center">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Loading...</span>
        </div>
      </div>

      <div v-if="error" class="alert alert-danger text-center">{{ error }}</div>

      <div v-if="requests.length && !isLoading">
        <table class="table table-hover table-striped table-bordered">
          <thead class="table-dark">
            <tr>
              <th>#</th>
              <th>Service ID</th>
              <th>Service Name</th>
              <th>Requested On</th>
              <th>Booked On</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(request, index) in filteredRequests" :key="request.id">
              <td>{{ index + 1 }}</td>
              <td>{{ request.service_id }}</td>
              <td>{{ request.service_name }}</td>
              <td>{{ formatDate(request.date_of_request) }}</td>
              <td>{{ formatDate(request.booking_date) }}</td>
              <td>
                <span :class="statusBadgeClass(request.service_request_status)">
                  {{ request.service_request_status }}
                </span>
              </td>
              <td>
              <button 
                v-if="request.statusLower !== 'closed' && request.statusLower !== 'accepted'" 
                @click="editRequest(request.id)" 
                class="btn btn-warning">
                Edit
              </button>
                
                <button v-if="request.statusLower !== 'closed'" @click="closeRequest(request.id)" class="btn btn-primary">
                  Close
                </button>
                <button v-if="request.service_request_status !== 'Closed'" @click="deleteRequest(request.id)" class="btn btn-danger">
                  Delete
                </button>

              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-else-if="!requests.length && !isLoading" class="text-center">
        <p>No service requests found.</p>
      </div>

      
    </div>
  </div>
  `
};
