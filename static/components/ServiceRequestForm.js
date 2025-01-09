export default {
    data() {
        return {
            request: {
                service_id: '',
                service_name: '',  // Will be populated automatically
                professional_id: '', // Automatically retrieved from backend
                date_of_request: '',
                service_request_status: 'requested',
                remarks: '',
                is_booked: false,
                is_accepted: false,
                is_closed: false,
                is_requested: true,
                booking_date: '',
                is_pending: false,
            },
            token: localStorage.getItem('auth-token'),
            isSubmitting: false,
            services: [],  // List of services for the dropdown
        };
    },
    created() {
        this.request.customer_id = this.getCustomerId();
        this.loadServices();
    },
    methods: {
        async loadServices() {
            try {
                const res = await fetch('/api/services', {
                    headers: {
                        'Authentication-Token': this.token
                    }
                });
                const data = await res.json();
                if (res.ok) {
                    this.services = data;
                } else {
                    alert(`Error fetching services: ${data.message}`);
                }
            } catch (error) {
                console.error('Error fetching services:', error);
                alert('Failed to load services.');
            }
        },

        async onServiceChange() {
            if (!this.request.service_id) return;
        
            try {
                const res = await fetch(`/api/services/${this.request.service_id}/professional`, {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authentication-Token': this.token
                    }
                });
                const data = await res.json();
                console.log("Professional fetch response:", data);  // Debug log
        
                if (res.ok) {
                    this.request.professional_id = data.professional_id;
                    this.request.service_name = data.service_name;
                } else {
                    alert(`No professional found for this service: ${data.message}`);
                }
            } catch (error) {
                console.error('Error fetching professional:', error);
                alert('Failed to fetch professional for the selected service.');
            }
        },
        
        getCustomerId() {
            return localStorage.getItem('user_id') || '';
        },

        async createRequest() {
            if (this.isSubmitting) return;
            this.isSubmitting = true;

            if (!this.request.service_id || !this.request.professional_id) {
                alert('Please select a valid service and ensure a professional is assigned.');
                this.isSubmitting = false;
                return;
            }

            try {
                const res = await fetch('/api/service-requests', {
                    method: 'POST',
                    headers: {
                        "Content-Type": "application/json",
                        'Authentication-Token': this.token
                    },
                    body: JSON.stringify(this.request)
                });
                
                const data = await res.json();
                
                if (res.ok) {
                    alert('Service request created successfully!');
                    this.$emit('requestCreated', data);
                    this.resetForm();
                    this.$router.push({ name: 'my-requests' });
                } else {
                    alert(`Error: ${data.message}`);
                }
            } catch (error) {
                console.error('Error creating service request:', error);
                alert('Something went wrong. Please try again.');
            } finally {
                this.isSubmitting = false;
            }
        },

        resetForm() {
            this.request = {
                service_id: '',
                service_name: '',
                professional_id: '',
                date_of_request: '',
                service_request_status: 'requested',
                remarks: '',
                is_booked: false,
                is_accepted: false,
                is_closed: false,
                is_requested: true,
                booking_date: '',
                is_pending: false,
            };
        }
    },
    template: `
    <div>
        <div class="container">
            <h2>Request Service</h2>

            <div class="form-group">
                <label for="service_id">Select Service</label>
                <select id="service_id" v-model="request.service_id" @change="onServiceChange" class="form-control">
                    <option value="">Select a service</option>
                    <option v-for="service in services" :key="service.service_id" :value="service.service_id">
                        {{ service.service_name }}
                    </option>
                </select>
            </div>

            <div class="form-group">
                <label for="date_of_request">Date of Request</label>
                <input id="date_of_request" type="date" v-model="request.date_of_request" class="form-control" />
            </div>
            
            <div class="form-group">
                <label for="remarks">Remarks</label>
                <textarea id="remarks" v-model="request.remarks" class="form-control"></textarea>
            </div>

            <div class="form-group">
                <label for="booking_date">Booking Date</label>
                <input id="booking_date" type="date" v-model="request.booking_date" class="form-control" />
            </div>
            <div class="form-group">
                <label for="booking_date">Completion Date</label>
                <input id="date_of_completion" type="date" v-model="request.date_of_completion" class="form-control" />
            </div> 
            <div class="form-group form-check">
                <input id="is_booked" type="checkbox" v-model="request.is_booked" class="form-check-input" />
                <label class="form-check-label" for="is_booked">Is Booked</label>
            </div>
            <div class="form-group form-check">
                <input id="is_requeted" type="checkbox" v-model="request.is_requested" class="form-check-input" />
                <label class="form-check-label" for="is_requested">Is Requested</label>
            </div>

            <button @click="createRequest" class="btn btn-success mt-3" :disabled="isSubmitting">Create Request</button>
        </div>
    </div>
    `
};
