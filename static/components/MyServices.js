export default {
  name: "MyServices",
  data() {
    return {
      myServices: [],
    };
  },
  
  methods: {
    async fetchMyServices() {
      try {
        const response = await fetch('/api/my-services', {
          headers: {
            'Content-Type': 'application/json',
            'Authentication-Token': localStorage.getItem('auth-token'),
          },
        });
    
        if (!response.ok) {
          const err = await response.json();
          console.error(`Error: ${err.message || 'Unknown error'}`);
          throw new Error(err.message || 'Unknown error');
        }
    
        const data = await response.json();
        
        // Ensure the response is an array
        if (Array.isArray(data)) {
          this.myServices = data; // Use the array
        } else {
          console.error('Unexpected response format:', data);
          this.myServices = []; // Set to empty list if response is not an array
        }
      } catch (error) {
        console.error('Fetch error:', error);
        this.myServices = [];
      }
    },
    
    statusClass(status) {
      return {
        accepted: "status-accepted",
        rejected: "status-rejected",
        pending: "status-pending",
      }[status] || "status-default";
    },

    async updateStatus(serviceId, newStatus) {
      try {
        const response = await fetch(`/api/update-service-status/${serviceId}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authentication-Token": localStorage.getItem("auth-token"),
          },
          body: JSON.stringify({ status: newStatus }),
        });

        if (!response.ok) {
          const err = await response.json();
          console.error(`Error updating status: ${err.message || "Unknown error"}`);
          throw new Error(err.message || "Unknown error");
        }

        const service = this.myServices.find((s) => s.id === serviceId);
        if (service) {
          service.professional_status = newStatus; // Update status locally
        }
      } catch (error) {
        console.error("Update status error:", error);
      }
    },
  },

  created() {
    this.fetchMyServices();
  },

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
            <th>Service Request Status</th>
            
          </tr>
        </thead>
        <tbody>
          <tr v-for="service in myServices" :key="service.id">
            <td>{{ service.service_id }}</td>
            <td>{{ service.service_name }}</td>
            <td>{{ service.customer_name }}</td>
            <td>{{ service.customer_contact }}</td>
            <td>{{ service.customer_address }}</td>
            <td>{{ service.pin_code }}</td>
            <td :class="statusClass(service.professional_status)">
              {{ service.professional_status }}
            </td>
            <td>
              <button 
                v-if="service.professional_status === 'pending'" 
                @click="updateStatus(service.id, 'accepted')" 
                class="btn btn-success btn-sm">Accept</button>
              <button 
                v-if="service.professional_status === 'pending'" 
                @click="updateStatus(service.id, 'rejected')" 
                class="btn btn-danger btn-sm">Reject</button>
            </td>
          </tr>
        </tbody>
      </table>
      <p v-else>No service requests found.</p>
    </div>
  `,
};
