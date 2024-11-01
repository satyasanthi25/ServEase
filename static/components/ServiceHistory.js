export default {
  name: 'ServiceHistory',
  data() {
    return {
      servicehistory: [],
      isLoading: true, // State to show loading indicator
      errorMessage: '', // State to handle error messages
    };
  },
  created() {
    this.fetchServiceRequests();
},

  methods: {
    async fetchServiceRequests() {
      try {
        const response = await fetch('/api/service-hist');
    
        if (!response.ok) {
          // Log the full response body for debugging
          const errorText = await response.text();
          console.error(`Error fetching service history: ${errorText}`);
          throw new Error(`HTTP error! status: ${response.status}`);
        }
    
        const data = await response.json(); // Parse JSON if the response is okay
        this.servicehistory = data; // Assign the fetched data
      } catch (error) {
        console.error('Error fetching service history:', error);
        alert('Failed to load service history. Please try again later.');
      }
    },
    
    
  },
  template: `
  <div class="histy-requests-container">
    <div class="histy-requests">
      <h2>Service History</h2>
      
      <!-- Loading indicator -->
      <div v-if="isLoading">Loading service history...</div>
      
      <!-- Error message display -->
      <div v-if="errorMessage" class="alert alert-danger">{{ errorMessage }}</div>
      
      <!-- Service history table -->
      <table v-if="!isLoading && servicehistory.length > 0" class="table table-striped table-bordered">
        <thead>
          <tr>
            <th>ID</th>
            <th>Assigned Professional</th>
            <th>Professional Contact</th>
            <th>Professional Address</th>
            <th>Service Name</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="request in servicehistory" :key="request.id">
            <td>{{ request.id }}</td>
            <td>{{ request.professional_name || 'Unassigned' }}</td>
            <td>{{ request.professional_contact || 'N/A' }}</td>
            <td>{{ request.professional_address || 'N/A' }}</td>
            <td>{{ request.service_name || 'N/A' }}</td>
            <td>{{ request.status }}</td>
          </tr>
        </tbody>
      </table>
      
      <!-- No service history message -->
      <p v-if="!isLoading && servicehistory.length === 0">No service history available.</p>
    </div>
  </div>
  `,
};
