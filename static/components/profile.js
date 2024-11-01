export default {
  data() {
    return {
      profile: {
        fullname: '',  
        username: '',
        email: '',
        password: '',
        address: '',
        pin_code: '',
        contact_no: '',
        service_name: '',
        experience_years: '',
        is_professional: false,
        is_approved: false,
        is_blocked: false
      },
      errors: {},  // Store validation errors
      isLoading: true,  
      isError: false,   
    };
  },
  methods: {
    fetchProfile() {
      fetch('/api/profile')
          .then(response => {
              console.log('Response Headers:', response.headers);
              console.log('Content-Type:', response.headers.get('content-type'));
  
              if (response.headers.get('content-type')?.includes('application/json')) {
                  return response.json();
              } else {
                  throw new Error('Expected JSON response but received a different format');
              }
          })
          .then(data => {
              this.profile = data;
          })
          .catch(error => {
              console.error('Error fetching profile:', error);
          });
  },
     
    
    validateForm() {
      this.errors = {};  // Clear errors before validation

      if (!this.profile.fullname) this.errors.fullname = "Full name is required.";
      if (!this.profile.username) this.errors.username = "Username is required.";
      if (!this.profile.email) {
        this.errors.email = "Email is required.";
      } else if (!/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(this.profile.email)) {
        this.errors.email = "Email format is invalid.";
      }
      if (!this.profile.password) this.errors.password = "Password is required.";
      if (!this.profile.address) this.errors.address = "Address is required.";
      if (!this.profile.pin_code) {
        this.errors.pin_code = "Pin code is required.";
      } else if (this.profile.pin_code.length !== 6) {
        
        this.errors.pin_code = "Pin code must be 6 digits.";
      }
      if (!this.profile.contact_no) {
        this.errors.contact_no = "Contact number is required.";
      } else if (this.profile.contact_no.length !== 10) {
        this.errors.contact_no = "Contact number must be 10 digits.";
      }
      if (this.profile.is_service_professional && !this.profile.service_name) {
        this.errors.service_name = "Service name is required for professionals.";
      }
      if (this.profile.is_professional && (isNaN(this.profile.experience_years) || this.profile.experience_years <= 0)) {
        this.errors.experience_years = "Experience years must be a positive number.";
      }

      return Object.keys(this.errors).length === 0;
    },

    async updateProfile() {
      if (!this.validateForm()) return;  // Prevent submission if form is invalid

      try {
        const response = await fetch('/api/profile', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(this.profile),
        });

        if (!response.ok) {
          throw new Error("Failed to update profile.");
        }

        const updatedProfile = await response.json();
        this.profile = { ...this.profile, ...updatedProfile };

        alert("Profile updated successfully");
      } catch (error) {
        alert("Failed to update profile.");
      }
    }
  },
  mounted() {
    this.fetchProfile();  // Call fetchProfile when the component is mounted
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
          <div class="form-group">
            <label for="fullname">Full Name</label>
            <input id="fullname" v-model="profile.fullname" type="text" class="form-control" />
            <span v-if="errors.fullname" class="text-danger">{{ errors.fullname }}</span>
          </div>
          <div class="form-group">
            <label for="username">Username</label>
            <input id="username" v-model="profile.username" type="text" class="form-control" />
            <span v-if="errors.username" class="text-danger">{{ errors.username }}</span>
          </div>
          <div class="form-group">
            <label for="email">Email</label>
            <input id="email" v-model="profile.email" type="email" class="form-control" />
            <span v-if="errors.email" class="text-danger">{{ errors.email }}</span>
          </div>
          <div class="form-group">
            <label for="password">Password</label>
            <input id="password" v-model="profile.password" type="password" class="form-control" />
            <span v-if="errors.password" class="text-danger">{{ errors.password }}</span>
          </div>
          <div class="form-group">
            <label for="address">Address</label>
            <input id="address" v-model="profile.address" type="text" class="form-control" />
            <span v-if="errors.address" class="text-danger">{{ errors.address }}</span>
          </div>
          <div class="form-group">
            <label for="pin_code">Pin Code</label>
            <input id="pin_code" v-model="profile.pin_code" type="text" class="form-control" />
            <span v-if="errors.pin_code" class="text-danger">{{ errors.pin_code }}</span>
          </div>
          <div class="form-group">
            <label for="contact_no">Contact No</label>
            <input id="contact_no" v-model="profile.contact_no" type="text" class="form-control" />
            <span v-if="errors.contact_no" class="text-danger">{{ errors.contact_no }}</span>
          </div>

          <div v-if="profile.is_professional">
            <div class="form-group">
              <label for="service_name">Service Name</label>
              <input id="service_name" v-model="profile.service_name" type="text" class="form-control" />
              <span v-if="errors.service_name" class="text-danger">{{ errors.service_name }}</span>
            </div>
            <div class="form-group">
              <label for="experience_years">Years of Experience</label>
              <input id="experience_years" v-model="profile.experience_years" type="number" class="form-control" />
              <span v-if="errors.experience_years" class="text-danger">{{ errors.experience_years }}</span>
            </div>
          </div>

          <button type="submit" class="btn btn-primary btn-block" :disabled="Object.keys(errors).length > 0">Update Profile</button>
        </form>
      </div>
    </div>
  `
};
