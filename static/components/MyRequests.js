export default {
  data() {
    return {
      requests: [],
      token: localStorage.getItem('auth-token'),
      isLoading: true,
      error: null,
      reviewText: '', // Initialize review text
      isReviewVisible: false, // State to control visibility of ReviewForm
      selectedRequest: null // Store the selected request for review
    };
  },
  props: {
    requestID: {
      type: String,
      required: false,
    }
  },
  computed: {
    computedRequestId() {
      return this.requestID || this.$route.params.requestId;
    }
  },
  async created() {
    await this.fetchRequests();
  },
  methods: {
    async fetchRequests() {
      try {
        const res = await fetch('/api/my-requests', {
          method: 'GET',
          headers: {
            "Content-Type": "application/json",
            'Authentication-Token': this.token
          }
        });

        const data = await res.json();

        if (res.ok) {
          this.requests = data.requests; // Populate requests array
        } else {
          this.error = `Error: ${data.message || 'Unable to fetch service requests'}`;
        }
      } catch (error) {
        console.error('Error fetching requests:', error);
        this.error = 'Something went wrong while fetching your requests.';
      } finally {
        this.isLoading = false;
      }
    },

    async closeRequest(requestId) {
      try {
        const response = await fetch(`/api/request/close/${requestId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authentication-Token': this.token,
          },
        });

        if (response.ok) {
          // Set the selected request and show the review form
          this.selectedRequest = this.requests.find(request => request.id === requestId);
          this.isReviewVisible = true;
          await this.fetchRequests(); // Re-fetch to get updated data
        } else {
          this.error = 'Failed to close the request.';
        }
      } catch (error) {
        console.error('Error closing request:', error);
        this.error = 'An error occurred while closing the request.';
      }
    },

    async submitReview() {
      // Logic to submit the review can be handled here if needed.
      // You can also invoke the review submission from the ReviewForm component.
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
    }
  },
  template: `
  <div>
  <div class="my-requests-container">
    <h2 class="text-center my-4">My Service Requests</h2>
    
    <!-- Loading state -->
    <div v-if="isLoading" class="text-center">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
    </div>
    
    <!-- Error message -->
    <div v-if="error" class="alert alert-danger text-center">{{ error }}</div>

    <!-- Requests table -->
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
          <tr v-for="(request, index) in requests" :key="request.id">
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
              <button v-if="request.service_request_status !== 'Closed'" @click="editRequest(request.id)" class="btn btn-primary">Edit</button>
              <button v-if="request.service_request_status !== 'Closed'" @click="closeRequest(request.id)" class="btn btn-danger">Close</button>
            </td>  
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Review Form for closed requests -->
    <div v-for="request in requests" v-if="request.service_request_status === 'Closed'" :key="request.id">
      <ReviewForm
        :requestID="request.id"
        :serviceName="request.service_name"
        :serviceID="request.service_id"
        :professionalID="request.professional_id"
        :professionalName="request.professional_name"
        :date="request.date"
        :contactNumber="request.contact_number"
        :isVisible="isReviewVisible"  <!-- Control visibility -->
        @closeRequest="isReviewVisible = false; selectedRequest = null"  <!-- Close review form and reset selected request -->
      />
    </div>

    <!-- No requests found -->
    <div v-else-if="!isLoading" class="text-center">
      <p>No service requests found.</p>
    </div>
  </div>
</div>
  `
};
