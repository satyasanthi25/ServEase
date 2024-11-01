export default {
  name: 'SearchResult',
  props: {
    results: {
      type: Array,
      required: true,
      default: () => []
    },
    role: {
      type: String,
      required: true,
      default: ''
    },
  },
  data() {
    return {
      error: null,
    };
  },
  template: `
    <div>
      <h2>Search Results</h2>
      <div v-if="error" class="alert alert-danger">{{ error }}</div>

      <!-- Display a different header based on the user role -->
      <h3 v-if="role === 'customer'">Available Services</h3>
      <h3 v-if="role === 'sp'">Available Requests</h3>
      <h3 v-if="role === 'admin'">Professional Profiles</h3>

      <!-- Display search results in a list -->
      <ul v-if="results && results.length > 0">
        <li v-for="result in results" :key="result.id">
          <div v-if="role === 'customer'">
            Service: {{ result.fullname }} - Location: {{ result.address }} (Pin: {{ result.pin_code }})
          </div>
          <div v-else-if="role === 'sp'">
            Request ID: {{ result.id }} - {{ result.customer_name }} - Location: {{ result.address }} (Date: {{ result.date }})
          </div>
          <div v-else-if="role === 'admin'">
            Professional: {{ result.fullname }} - Location: {{ result.address }}
          </div>
        </li>
      </ul>

      <!-- Display a message if no results are found -->
      <div v-else>
        <p>No results found.</p>
      </div>
    </div>
  `,
};
