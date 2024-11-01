export default {
  props: ['requestID', 'serviceName', 'serviceID', 'professionalID', 'professionalName', 'date', 'contactNumber'],
  data() {
    return {
      rating: 0,
      comments: ''
    };
  },
  created() {
    const requestId = this.$route.params.id;
    this.requestID = requestId;
  },
  methods: {
    setRating(star) {
      this.rating = star;
    },
    submitReview() {
      const reviewData = {
        service_request_id: this.requestID,
        user_id: this.$store.state.user.id,  // Add user ID from store or session
        service_id: this.serviceID,  // Add service ID
        rating: this.rating,
        comments: this.comments,
        date_posted: new Date()
      };

      // Send POST request to backend to submit the review
      fetch('/api/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reviewData)
      })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          alert('Review submitted successfully');
          this.$emit('closeRequest'); 
        } else {
          alert('Failed to submit review');
        }
      })
      .catch(err => console.error(err));
    },
    closeWithoutReview() {
      this.$emit('closeRequest');
    }
  },
  template: `
  <div class="modal fade" id="reviewModal" tabindex="-1" role="dialog" aria-labelledby="reviewModalLabel" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered" role="document">
      <div class="modal-content">
        <div class="modal-header">
          <h3>Service Remarks</h3>
        </div>
        <div class="modal-body">
          <div class="review-form">
            <div>Request ID: {{ requestID }}</div>

            <div class="form-group">
              <label>Service Name</label>
              <input type="text" v-model="serviceName" disabled />
            </div>
            <div class="form-group">
              <label>Professional ID</label>
              <input type="text" v-model="professionalID" disabled />
            </div>
            <div class="form-group">
              <label>Professional Name</label>
              <input type="text" v-model="professionalName" disabled />
            </div>
            <div class="form-group">
              <label>Date</label>
              <input type="date" v-model="date" disabled />
            </div>
            <div class="form-group">
              <label>Contact No.</label>
              <input type="text" v-model="contactNumber" disabled />
            </div>

            <div class="form-group">
              <label>Service Rating</label>
              <div class="rating">
                <span v-for="star in 5" :key="star" @click="setRating(star)">
                  <i :class="star <= rating ? 'fas fa-star' : 'far fa-star'"></i>
                </span>
              </div>
            </div>

            <div class="form-group">
              <label>Remarks (if any)</label>
              <textarea v-model="comments"></textarea>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button @click="submitReview" class="btn btn-primary">Submit</button>
          <button @click="closeWithoutReview" class="btn btn-secondary">Close</button>
        </div>
      </div>
    </div>
  </div>
`
};
