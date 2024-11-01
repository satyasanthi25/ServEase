export default {
  name: 'MyServices',
  data() {
    return {
      myServices: [], 
    };
  },
  
  methods: {
    fetchMyServices() {
      fetch('/api/my-services', {
        headers: {
          'Content-Type': 'application/json',
          'Authentication-Token': localStorage.getItem('auth-token')
        }
      })
      .then((response) => response.json())
      .then((data) => {
        this.myServices = data;
      })
      .catch((error) => {
        console.error('Error fetching services:', error);
      });
    },
    
    statusClass(status) {
      if (status === 'accepted') {
        return 'status-accepted';
      } else if (status === 'rejected') {
        return 'status-rejected';
      } else {
        return ''; // default class or empty for other statuses
      }
    }
  },
  
  created() {
    this.fetchMyServices();
  },
  
  // Component's template for displaying the services in a table
  template: `
  <div class="today-services-container">
  <h2>My Services</h2>
  <table class="table table-striped table-bordered" v-if="myServices.length > 0">
    <thead>
      <tr>
        <th>Service ID</th>
        <th>Service Name</th>
        <th>Customer Name</th>
        <th>Customer Contact</th>
        <th>Customer Address</th>
        <th>Pin Code</th>
        <th>Professional Status</th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="request in myServices" :key="request.id">
        <td>{{ request.id }}</td>
        <td>{{ request.service_name }}</td>
        <td>{{ request.customer_name }}</td>
        <td>{{ request.customer_contact_no }}</td>
        <td>{{ request.customer_address }}</td>
        <td>{{ request.customer_pin_code }}</td>
        <!-- Apply dynamic classes for status colors -->
        <td :class="statusClass(request.professional_status)">
          {{ request.professional_status }}
        </td>
      </tr>
    </tbody>
  </table>
  <p v-else>No service requests found.</p>
</div>
  `,
};
