export default {
  name: 'TodayServices',
  data() {
    return {
      todaysServices: [], // Store today’s service requests
    };
  },
  created() {
    //console.log("Component created, fetching today's services");
    this.fetchTodayServices();
  },
  methods: {
    fetchTodayServices() {
      fetch('/api/today-services')
        .then((response) => {
          // Check if the response status is OK (200-299)
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          return response.json();
        })
        .then((data) => {
          console.log('Fetched services:', data); // Log the fetched data
          this.todaysServices = data;
        })
        .catch((error) => {
          console.error('Error fetching todays services:', error);
        });
    },
    

    // Accept action
    acceptRequest(requestId) {
      fetch(`/api/accept-service/${requestId}`, { method: 'POST' })
        .then(() => {
          alert(`Service Request ID ${requestId} accepted`);
          this.fetchTodayServices(); // Refresh the list after accepting
        })
        .catch((error) => {
          console.error('Error accepting service request:', error);
        });
    },

    // Reject action
    rejectRequest(requestId) {
      fetch(`/api/reject-service/${requestId}`, { method: 'POST' })
        .then(() => {
          alert(`Service Request ID ${requestId} rejected`);
          this.fetchTodayServices(); // Refresh the list after rejecting
        })
        .catch((error) => {
          console.error('Error rejecting service request:', error);
        });
    },
  },
  template: `
    <div class="today-services-container">
      <h2>Today's Services</h2>
      <table class="table table-striped table-bordered">
        <thead>
          <tr>
            <th>Service ID</th>
            <th>Customer Name</th>
            <th>Contact No</th>
            <th>Customer Address</th>
            <th>Pin Code</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="request in todaysServices" :key="request.id">
            <td>{{ request.id }}</td>
            <td>{{ request.customer_name }}</td>
            <td>{{ request.customer_contact_no }}</td>
            <td>{{ request.customer_address }}</td>
            <td>{{ request.customer_pin_code }}</td>
            <td>
              <button @click="acceptRequest(request.id)" class="btn btn-success">Accept</button>
              <button @click="rejectRequest(request.id)" class="btn btn-danger">Reject</button>
            </td>
          </tr>
        </tbody>
      </table>
      <p v-if="todaysServices.length === 0">No service requests for today.</p>
    </div>
  `,
};
