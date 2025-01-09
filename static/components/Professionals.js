export default {
    data() {
        return {
            professionals: [],
            loading: false,
            error: null,
        };
    },
    methods: {
        // Fetch professionals and their details
        async getProfessionals() {
            this.loading = true;
            this.error = null;
            try {
                const response = await fetch('http://127.0.0.1:5000/api/professionals', {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authentication-Token': localStorage.getItem('auth-token')?.trim()
                    }
                });
        
                if (!response.ok) {
                    console.error('Failed to fetch professionals:', response.statusText);
                    this.error = `Error: ${response.statusText}`;
                    return;
                }
        
                const contentType = response.headers.get("content-type");
                if (contentType && contentType.includes("application/json")) {
                    const data = await response.json();
                    console.log('Fetched data:', data);
                    this.professionals = Array.isArray(data) ? data.map(professional => ({
                        ...professional,
                        is_approved: professional.is_approved === "Yes",
                        is_blocked: professional.is_blocked === "Yes",
                        is_professional: professional.is_professional === "Yes",
                    })) : [];
                } else {
                    console.error('Expected JSON response, got:', contentType);
                    this.error = 'Unexpected response format. Please check the server.';
                }
            } catch (error) {
                console.error('Error fetching professionals:', error);
                this.error = 'An error occurred while fetching data.';
            } finally {
                this.loading = false;
            }
        },

        // Approve the professional
        async approveProfessional(professionalId) {
            try {
                const response = await fetch(`http://127.0.0.1:5000/api/professionals/${professionalId}/approve`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authentication-Token': localStorage.getItem('auth-token')?.trim()
                    }
                });
        
                if (response.ok) {
                    const data = await response.json(); // Parse the JSON response
        
                    // Update the professional status to approved
                    this.professionals = this.professionals.map(professional =>
                        professional.id === professionalId
                            ? { ...professional, is_approved: true } // Update to true upon approval
                            : professional
                    );
        
                    alert(data.message || `Professional ${professionalId} approved successfully.`);
                } else {
                    console.error('Failed to approve professional:', response.statusText);
                    this.error = `Error: ${response.statusText}`;
                    alert('Failed to approve the professional. Please try again.');
                }
            } catch (error) {
                console.error('Error approving professional:', error);
                this.error = 'An error occurred while approving the professional.';
                alert('An error occurred while approving the professional. Please check the console for more details.');
            }
        },
        
        // Decline the professional (set is_approved to false)
        async declineProfessional(professionalId) {
            try {
                const response = await fetch(`http://127.0.0.1:5000/api/professionals/${professionalId}/decline`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authentication-Token': localStorage.getItem('auth-token')?.trim()
                    }
                });
        
                if (response.ok) {
                    // Update the professional status to declined
                    this.professionals = this.professionals.map(professional =>
                        professional.id === professionalId
                            ? { ...professional, is_approved: false } // Update to false upon decline
                            : professional
                    );
                    console.log(`Professional ${professionalId} declined successfully.`);
                } else {
                    console.error('Failed to decline professional:', response.statusText);
                    this.error = `Error: ${response.statusText}`;
                }
            } catch (error) {
                console.error('Error declining professional:', error);
                this.error = 'An error occurred while declining the professional.';
            }
        },
    },

    async mounted() {
        await this.getProfessionals();
    },

    template: `
        <div>
            <h2>Manage Professionals</h2>
            <div v-if="loading">Loading...</div>
            <p v-if="error" style="color: red;">{{ error }}</p>          
            <table v-if="!loading && !error && professionals.length" class="table">
                <thead>
                    <tr>
                        <th>#</th>
                        <th>ID</th>
                        <th>Name</th>
                        <th>Experience</th>
                        <th>Service Name</th>
                        <th>Approved</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="(professional, index) in professionals" :key="professional.id">
                        <td>{{ index + 1 }}</td>
                        <td>{{ professional.id }}</td>
                        <td>{{ professional.fullname }}</td>
                        <td>{{ professional.experience_years || 'N/A' }}</td>
                        <td>{{ professional.service_name || 'N/A' }}</td>
                        <td>{{ professional.is_approved ? 'Yes' : 'No' }}</td>
                        <td>
                            <button v-if="!professional.is_approved" 
                                    @click="approveProfessional(professional.id)">Approve</button>
                            <button v-if="professional.is_approved" 
                                    @click="declineProfessional(professional.id)">Decline</button>
                        </td>
                    </tr>
                </tbody>
            </table>
            <div v-else-if="!loading && !error && !professionals.length">No professionals found.</div>
        </div>
    `
};
