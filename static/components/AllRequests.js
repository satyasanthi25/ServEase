export default {
  name: 'AllRequests',
  data() {
    return {
      serviceRequests: [],
      loading: true,    // Added to handle loading state
      error: null       // Added to handle error state
    };
  },
  created() {
    this.fetchServiceRequests();
  },
  methods: {
    async fetchServiceRequests() {
      try {
        const response = await fetch('/api/admin/all-requests');
        if (!response.ok) {
          throw new Error('Failed to fetch service requests');
        }
        const data = await response.json();
        this.serviceRequests = data;
      } catch (error) {
        this.error = 'Error fetching service requests';
        console.error(error);
      } finally {
        this.loading = false;  // Ensure loading state is set to false after data is fetched
      }
    },
    formatDate(dateString) {
      if (!dateString) return 'N/A';
      const date = new Date(dateString);
      return date.toLocaleDateString();
    }
  },
  template: `
    <div class="all-requests-container">
      <h2>All Service Requests</h2>
      
      <div v-if="loading" class="loading">
        Loading service requests...
      </div>

      <div v-if="error" class="error">
        {{ error }}
      </div>

      <div v-if="!loading && !error" class="all-requests">
        <table class="table table-striped table-bordered">
          <thead>
            <tr>
              <th>ID</th>
              <th>Assigned Professional</th>
              <th>Service Name</th>
              <th>Status of Service Request</th>
              <th>Date of Request</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="request in serviceRequests" :key="request.id">
              <td>{{ request.id }}</td>
              <td>{{ request.professional_name || 'Unassigned' }}</td>
              <td>{{ request.service_type || 'N/A' }}</td>
              <td>{{ request.status }}</td>
              <td>{{ formatDate(request.date_of_request) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `
};
