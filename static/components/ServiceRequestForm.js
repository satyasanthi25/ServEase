export default {
    data() {
        return {
            request: {
                service_id: '',
                service_name: '',  // New field for service name
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
            isSubmitting: false
        };
    },
    created() {
        // Automatically populate service_id and customer_id
        this.request.customer_id = this.getCustomerId(); // Assuming the customer ID is stored in local storage
        this.request.service_id = this.getServiceId(); // Get service ID from route params
    },
    methods: {
        getServiceId() {
            // Fetch the service_id from the route parameters using Vue Router
            return this.$route.params.service_id || '';
        },
        
        getCustomerId() {
            // Logic to get the customer_id from local storage or other source
            return localStorage.getItem('user_id') || ''; // Replace with actual logic
        },
        
        async createRequest() {
            if (this.isSubmitting) return;
            this.isSubmitting = true;
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
                    
                    // Emit event with the new request to the parent component
                    this.$emit('requestCreated', data);

                    // Reset form
                    this.resetForm();
                    
                    // Redirect to "My Requests" tab
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
                date_of_request: '',
                service_request_status: 'requested',
                remarks: '',
                is_booked:'',
                is_booking:'',
                booking_date:'',
               
            };
        }
    },
    template: `
    <div>
        <div class="container">
            <h2>Request Service</h2>
            
            <div class="form-group">
                <label for="service_id">Service ID</label>
                <input id="service_id" type="number" v-model="request.service_id" class="form-control" />
            </div>
            <div class="form-group">
                <label for="service_name">Service Name</label>
                <input id="service_name" type="text" v-model="request.service_name" class="form-control" />
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
            <div class="form-group form-check">
                <input id="is_booked" type="checkbox" v-model="request.is_booked" class="form-check-input" />
                <label class="form-check-label ml-2" for="is_booked">Is Booked</label>
            </div>
            <div class="form-group form-check">
                <input id="is_requested" type="checkbox" v-model="request.is_requested" class="form-check-input" />
                <label class="form-check-label ml-2" for="is_requested">Is Requested</label>
            </div>
            <button @click="createRequest" class="btn btn-success mt-3" :disabled="isSubmitting">Create Request</button>
        </div>
    </div>
    `
};
