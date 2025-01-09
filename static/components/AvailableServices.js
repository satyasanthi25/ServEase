export default {
  name: "AvailableServices",
  data() {
    return {
      services: [], // Array to store services
      loading: false, // Loading state
      error: null, // Error message
    };
  },
  methods: {
    // Fetch services from the backend
    async fetchServices() {
      this.loading = true;
      this.error = null;
      const customerId = localStorage.getItem("id"); // Ensure `customer_id` is stored in localStorage
  
      if (!customerId) {
          this.error = "Customer ID not found.";
          this.loading = false;
          return;
      }
  
      try {
        const response = await fetch(`/cust-services/${customerId}`, {
          method: "GET",
          headers: {
              "Authentication-Token": localStorage.getItem("auth-token"),
              "Content-Type": "application/json",
          },
        });   
        if (!response.ok) {
            throw new Error("Failed to fetch services.");
        }
        const data = await response.json();
        this.services = data;
      } catch (err) {
          this.error = err.message || "An error occurred. Please try again.";
      } finally {
          this.loading = false;
      }
    },
  
  },  
  mounted() {
    // Fetch services when the component is mounted
    this.fetchServices();
  },

  template:`
  <div>
      <div class="container mt-5">
      <h2 class="text-center">Available Services</h2>

      <!-- Show loader while fetching services -->
      <div v-if="loading" class="text-center">
        <div class="spinner-border" role="status">
          <span class="sr-only">Loading...</span>
        </div>
      </div>

      <!-- Show error message if there's an issue -->
      <div v-if="error" class="alert alert-danger" role="alert">
        {{ error }}
      </div>

      <!-- Display list of services -->
      <div v-if="services.length > 0" class="row">
        <div v-for="service in services" :key="service.service_id" class="col-md-4">
          <div class="card mb-4 shadow-sm">
            <img
              v-if="service.image"
              :src="service.image"
              class="card-img-top"
              alt="Service Image"
            />
            <div class="card-body">
              <h5 class="card-title">{{ service.service_name }}</h5>
              <p class="card-text">
                {{ service.description || 'No description available.' }}
              </p>
              <p class="text-muted">
                <strong>Price: </strong>  &#8377{{ service.base_price }}
              </p>
              <p class="text-muted">
                <strong>Rating: </strong> {{ service.service_rating || 'N/A' }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- No services available -->
      <div v-else-if="!loading && services.length === 0" class="text-center">
        <p>No services available matching your address.</p>
      </div>
    </div>
      
  </div>    
  `
};    