export default {
  name: 'ClosedServices',
  props: ['requestID'], // Assuming you have a prop named requestID
  data() {
    return {
      closedServices: [], // Store closed service requests
      localRequestID: this.requestID, // Local copy of the prop
    };
  },
  watch: {
    // Watch for changes in the requestID prop to update the local copy if necessary
    requestID(newVal) {
      this.localRequestID = newVal;
    },
  },
  created() {
    console.log("Component created, fetching closed services");
    this.fetchClosedServices(); // Ensure this function is accessible
  },
  methods: {
    fetchClosedServices() {
      fetch('/api/closed-services') // Ensure this URL returns closed service requests
        .then((response) => {
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          return response.json();
        })
        .then((data) => {
          console.log('Fetched closed services:', data); // Log the fetched data
          this.closedServices = data; // Assign the fetched data to closedServices
        })
        .catch((error) => {
          console.error('Error fetching closed services:', error);
        });
    },
  },

  template: `
    <div class="closed-services-container">
      <h2>Closed Services</h2>
      <table class="table table-striped table-bordered">
        <thead>
          <tr>
            <th>Service Name</th>
            <th>Customer Name</th>
            <th>Contact No</th>
            <th>Customer Address</th>
            <th>Pin Code</th>
            <th>Date</th>
            
          </tr>
        </thead>
        <tbody>
          <tr v-for="request in closedServices" :key="request.id">
          <td>{{ request.service_name }}</td>
          <td>{{ request.customer_name || 'N/A' }}</td>
          <td>{{ request.customer_contact_no || 'N/A' }}</td>
          <td>{{ request.customer_address || 'N/A' }}</td>
          <td>{{ request.customer_pin_code || 'N/A' }}</td>
          <td>{{ request.date_of_completion || 'N/A' }}</td>          
        </tr>
        </tbody>
      </table>
      <p v-if="closedServices.length === 0">No closed services available.</p>
    </div>
  `,
};
