export default {
  data() {
    return {
      professionals: [] // Store the list of professionals here
    };
  },
  mounted() {
    this.fetchProfessionals();
  },
  methods: {
    async fetchProfessionals() {
      try {
          const response = await fetch('/api/professionals/similar_location', {
            method: 'GET',
            headers: {
                'Authentication-Token':localStorage.getItem('auth-token'), 
                'Content-Type': 'application/json'
            },
              credentials: 'include'
          });
  
          console.log("Response status:", response.status);
          console.log("Response headers:", response.headers);
  
          if (!response.ok) {
              throw new Error(`Error ${response.status}: ${response.statusText}`);
          }
  
          const contentType = response.headers.get("content-type");
          if (contentType && contentType.includes("application/json")) {
              const data = await response.json();
              console.log("Data received:", data);  // Log the data received
              if (Object.keys(data).length === 0) {
                  console.warn("Received empty or minimal data.");
              }
              this.professionals = data;
          } else {
              const text = await response.text();
              console.error("Unexpected response format:", text);
              throw new Error("Expected JSON response but got HTML or other format");
          }
      } catch (error) {
          console.error("Fetch error:", error);
          this.errorMessage = "Failed to load professionals. Please try again.";
      }
  }
  
  },
template:`
     <div>
        <h2>Available Professionals in Your Area</h2>
        <div v-if="professionals.length > 0" class="card-container">
          <div v-for="professional in professionals" :key="professional.id" class="card">
            <h3>{{ professional.fullname }}</h3>
            <p><strong>Professional ServiceType:</strong> {{ professional.service_name }}</p>
            <p><strong>Experience:</strong> {{ professional.experience_years }} years</p>
            <p><strong>Contact:</strong> {{ professional.contact_no }}</p>
            <p><strong>Address:</strong> {{ professional.address }}</p>
            <p><strong>Pin Code:</strong> {{ professional.pin_code }}</p>
          </div>
        </div>
        <div v-else>
          <p>No professionals found in your location.</p>
        </div>
      </div>
`,


  
};
