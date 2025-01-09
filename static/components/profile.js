export default {
  data() {
    return {
      profile: {
        fullname: '',  
        username: '',
        password: '',
        email: '',
        address: '',
        pin_code: '',
        contact_no: '',
        service_name: '',
        experience_years: 0,
        is_professional: false,
      },
      isLoading: true,
      isError: false,
      validationErrors: [],
    };
  },
  methods: {
    // Fetch profile data from the API
    async fetchProfile() {
      this.isLoading = true;
      this.isError = false;

      try {
        const response = await fetch('/api/profile', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authentication-Token': localStorage.getItem('auth-token'),
          },
        });

        if (!response.ok) {
          this.isError = true;
          return;
        }

        const data = await response.json();
        this.profile = { ...data };
      } catch (error) {
        console.error("Error fetching profile:", error);
        this.isError = true;
      } finally {
        this.isLoading = false;
      }
    },

    // Validate form data before updating the profile
    validateProfileData() {
      this.validationErrors = [];

      // Full name validation
      if (!this.profile.fullname || this.profile.fullname.length < 3) {
        this.validationErrors.push("Full Name must be at least 3 characters.");
      }

      // Username validation
      if (!this.profile.username || this.profile.username.length < 3) {
        this.validationErrors.push("Username must be at least 3 characters.");
      } else if (!/^[a-zA-Z0-9_.-]+$/.test(this.profile.username)) {
        this.validationErrors.push("Username can only contain letters, numbers, dots, underscores, and hyphens.");
      }

      // Email validation
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!this.profile.email || !emailPattern.test(this.profile.email)) {
        this.validationErrors.push("Please provide a valid email.");
      }

      // Address validation
      if (!this.profile.address || this.profile.address.length < 4) {
        this.validationErrors.push("Address must be at least 4 characters.");
      }

      // Pin code validation
      if (!this.profile.pin_code || !/^\d{5,6}$/.test(this.profile.pin_code)) {
        this.validationErrors.push("Pin code must be 5 or 6 digits long.");
      }

      // Contact number validation
      if (!this.profile.contact_no || !/^\d{10}$/.test(this.profile.contact_no)) {
        this.validationErrors.push("Contact number must be exactly 10 digits.");
      }

      // Service name and experience for professionals
      if (this.profile.is_professional) {
        if (!this.profile.service_name || this.profile.service_name.length < 3) {
          this.validationErrors.push("Service name must be at least 3 characters long.");
        }

        if (this.profile.experience_years < 0) {
          this.validationErrors.push("Years of experience must be a non-negative number.");
        }
      }

      // If there are validation errors, return false
      return this.validationErrors.length === 0;
    },

    // Update profile data in the database
    async updateProfile() {
      // Validate data before sending
      if (!this.validateProfileData()) {
        alert(this.validationErrors.join("\n"));
        return;
      }

      const profileUpdate = {
        fullname: this.profile.fullname,
        username: this.profile.username,
        email: this.profile.email,
        address: this.profile.address,
        pin_code: this.profile.pin_code,
        contact_no: this.profile.contact_no,
        service_name: this.profile.service_name,
        experience_years: this.profile.experience_years,
      };

      try {
        const response = await fetch('/api/profile', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authentication-Token': localStorage.getItem('auth-token'),
          },
          body: JSON.stringify(profileUpdate),
        });

        if (!response.ok) {
          const errorData = await response.json();
          console.error("Failed to update profile:", errorData.errors || errorData.message);
          alert(`Failed to update profile: ${errorData.errors?.join(", ") || errorData.message}`);
          return;
        }

        const result = await response.json();
        this.profile = { ...this.profile, ...result };
        alert("Profile updated successfully");
        // Re-fetch the profile to ensure data consistency with the backend
        await this.fetchProfile();
      } catch (error) {
        alert("An error occurred while updating the profile.");
        console.error("Error updating profile:", error);
      }
    },
  },
  
  mounted() {
    this.fetchProfile();
  },
  
  template: `
    <div class="container mt-4">
      <h2 class="text-center">Profile Details</h2>

      <div v-if="isLoading" class="text-center">
        <div class="spinner-border" role="status">
          <span class="sr-only">Loading...</span>
        </div>
      </div>

      <div v-if="isError" class="alert alert-danger" role="alert">
        Error loading profile. Please try again later.
      </div>

      <div v-if="!isLoading && !isError">
        <form @submit.prevent="updateProfile" class="p-4 border rounded bg-light">
          <div v-if="validationErrors.length" class="alert alert-warning">
            <ul>
              <li v-for="error in validationErrors" :key="error">{{ error }}</li>
            </ul>
          </div>
          
          <div class="form-group">
            <label>Full Name</label>
            <input v-model="profile.fullname" type="text" class="form-control" required />
          </div>
          <div class="form-group">
            <label>Username</label>
            <input v-model="profile.username" type="text" class="form-control" required />
          </div>
          <div class="form-group">
            <label>Email</label>
            <input v-model="profile.email" type="email" class="form-control" required />
          </div>
          <div class="form-group">
            <label>Address</label>
            <input v-model="profile.address" type="text" class="form-control" required />
          </div>
          <div class="form-group">
            <label>Pin Code</label>
            <input v-model="profile.pin_code" type="text" class="form-control" required />
          </div>
          <div class="form-group">
            <label>Contact No</label>
            <input v-model="profile.contact_no" type="text" class="form-control" required />
          </div>
          
          <div v-if="profile.is_professional">
            <div class="form-group">
              <label>Service Name</label>
              <input v-model="profile.service_name" type="text" class="form-control" />
            </div>
            <div class="form-group">
              <label>Years of Experience</label>
              <input v-model="profile.experience_years" type="number" class="form-control" min="0" />
            </div>
          </div>

          <button type="submit" class="btn btn-primary btn-block">Update Profile</button>
        </form>
      </div>
    </div>
  `,
};
