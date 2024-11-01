export default {
    data: () => ({
        professionals: [],  // List of service professionals
        loading: false,     // Loader flag
    }),
    methods: {
        // Fetch list of professionals
        async getProfessionals() {
            this.loading = true;
            try {
                const response = await fetch('/api/professionals', {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authentication-Token': localStorage.getItem('auth-token')
                    }
                });
                if (response.ok) {
                    this.professionals = await response.json();
                } else {
                    console.error('Failed to fetch professionals:', response.statusText);
                }
            } catch (error) {
                console.error('Error fetching professionals:', error);
            } finally {
                this.loading = false;
            }
        },
        // Approve a professional
        async approveProfessional(id) {
            try {
                const response = await fetch(`/api/admin/approve/${id}`, { 
                    method: 'POST',
                    headers: {
                        'Authentication-Token': localStorage.getItem('auth-token')
                    }
                });
                if (response.ok) {
                    this.getProfessionals();  // Refresh the list after approval
                } else {
                    console.error('Failed to approve professional:', response.statusText);
                }
            } catch (error) {
                console.error('Error approving professional:', error);
            }
        },
        // Block a professional
        async rejectProfessional(id) {
            try {
                const response = await fetch(`/api/admin/reject/${id}`, { 
                    method: 'POST',
                    headers: {
                        'Authentication-Token': localStorage.getItem('auth-token')
                    }
                });
                if (response.ok) {
                    this.getProfessionals();  // Refresh the list after rejection
                } else {
                    console.error('Failed to block professional:', response.statusText);
                }
            } catch (error) {
                console.error('Error blocking professional:', error);
            }
        },
        // Delete a professional
        async deleteProfessional(id) {
            try {
                const response = await fetch(`/api/admin/delete/${id}`, { 
                    method: 'DELETE',
                    headers: {
                        'Authentication-Token': localStorage.getItem('auth-token')
                    }
                });
                if (response.ok) {
                    this.getProfessionals();  // Refresh the list after deletion
                } else {
                    console.error('Failed to delete professional:', response.statusText);
                }
            } catch (error) {
                console.error('Error deleting professional:', error);
            }
        }
    },
    // Fetch professionals data when the component is mounted
    mounted() {
        this.getProfessionals();
    },
    // Component template section
    template: `
        <div>
            <h2>Manage Professionals</h2>
            <div v-if="loading">Loading...</div>
            <table v-if="!loading && professionals.length" class="table">
                <thead>
                    <tr>
                        <th>#</th>
                        <th>ID</th>
                        <th>Name</th>
                        <th>Experience</th>
                        <th>Service Name</th>
                        <th>Approved</th>
                        <th>Blocked</th>
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
                        <td>{{ professional.is_blocked? 'Yes' : 'No' }}</td>  <!-- Blocked column -->
                        <td>
                            <button v-if="!professional.is_approved" class="btn btn-success" @click="approveProfessional(professional.id)">Approve</button>
                            <button v-if="!professional.is_blocked" class="btn btn-info" @click="rejectProfessional(professional.id)">Block</button>
                            <button class="btn btn-danger" @click="deleteProfessional(professional.id)">Delete</button>
                        </td>
                    </tr>
                </tbody>
            </table>
            <div v-else-if="!loading && !professionals.length">No professionals found.</div>
        </div>
    `
};
