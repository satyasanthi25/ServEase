
export default {
  props: {
    role: {
      type: String,
      required: true,
    },
  },
  data() {
    return {
      searchQuery: '',
      address: '',
      pin_code: '',
      date_of_request: '',
      services: [],
      professionals: [],
      requests: [],
      loading: false, // New loading state
      error: null,    // Error state
    };
  },
  methods: {
    // For Customers
    searchServices() {
      if (!this.searchQuery && !this.address && !this.pin_code) return;
      this.loading = true;
      const params = new URLSearchParams({
        query: this.searchQuery,
        address: this.address,
        pin_code: this.pin_code,
      }).toString();
  
      fetch(`/api/search/services?${params}`)
        .then(response => response.json())
        .then(data => {
          this.services = data;
          // Navigate to SearchResult view with search results
          this.$router.push({ 
            name: 'SearchResult', 
            params: { results: this.services, role: this.role }
          });
          
        })
        .catch(error => {
          console.error('Error fetching services:', error);
          this.error = 'Failed to fetch services.';
        })
        .finally(() => {
          this.loading = false;
        });
    },

    // For Service Professionals
    searchRequests() {
      if (!this.searchQuery && !this.date_of_request && !this.address && !this.pin_code) return;
      this.loading = true;
      const params = new URLSearchParams({
        query: this.searchQuery,
        date_of_request: this.date_of_request,
        address: this.address,
        pin_code: this.pin_code,
      }).toString();
  
      fetch(`/api/search/requests?${params}`)
        .then(response => response.json())
        .then(data => {
          this.requests = data;
          // Navigate to SearchResult view with search results
          this.$router.push({ 
            name: 'SearchResult', 
            params: { results: this.requests, role: this.role }
          });
        })
        .catch(error => {
          console.error('Error fetching requests:', error);
          this.error = 'Failed to fetch requests.';
        })
        .finally(() => {
          this.loading = false;
        });
    },

    // For Admins
    searchProfessionals() {
      if (!this.searchQuery) return;
      this.loading = true;
      const params = new URLSearchParams({ query: this.searchQuery }).toString();
  
      fetch(`/api/search/professionals?${params}`)
        .then(response => response.json())
        .then(data => {
          this.professionals = data;
          // Navigate to SearchResult view with search results
          this.$router.push({ 
            name: 'SearchResult', 
            params: { results: this.professionals, role: this.role }
          });
        })
        .catch(error => {
          console.error('Error fetching professionals:', error);
          this.error = 'Failed to fetch professionals.';
        })
        .finally(() => {
          this.loading = false;
        });
    },

    blockProfessional(id) {
      console.log(`Blocking professional with ID: ${id}`);
      // Implement block logic
    },
    unblockProfessional(id) {
      console.log(`Unblocking professional with ID: ${id}`);
      // Implement unblock logic
    },
    reviewProfessional(id) {
      console.log(`Reviewing professional with ID: ${id}`);
      // Implement review logic
    },
  },
  template: `
    <div>
      <h2>Search Dashboard</h2>

      <!-- Error message -->
      <div v-if="error" class="alert alert-danger">{{ error }}</div>

      <!-- Loading Spinner -->
      <div v-if="loading" class="spinner-border text-primary" role="status">
        <span class="sr-only">Loading...</span>
      </div>

      <!-- Customer Search Section -->
      <div v-if="role === 'Customer'">
        <input v-model.trim="searchQuery" placeholder="Search for services" @change="searchServices" />
        <input v-model.trim="address" placeholder="Address" @change="searchServices" />
        <input v-model.trim="pin_code" placeholder="Pin Code" @change="searchServices" />
      </div>

      <!-- Professional Search Section -->
      <div v-if="role === 'sp'">
        <input v-model.trim="searchQuery" placeholder="Search by date or address" @change="searchRequests" />
        <input v-model="date_of_request" type="date" placeholder="Date of Request" @change="searchRequests" />
        <input v-model.trim="address" placeholder="Address" @change="searchRequests" />
        <input v-model.trim="pin_code" placeholder="Pin Code" @change="searchRequests" />
      </div>

      <!-- Admin Search Section -->
      <div v-if="role === 'Admin'">
        <input v-model.trim="searchQuery" placeholder="Search for professionals" @change="searchProfessionals" />
      </div>
    </div>
  `,
};
