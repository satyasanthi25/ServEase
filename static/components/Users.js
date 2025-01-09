export default {
  template: `
  <div> <!-- Single root element wrapping all content -->
      <div class="container mt-4">
          <div v-if="error" class="alert alert-danger">
            {{ error }}
          </div>

          <div v-if="!error && allUsers.length === 0" class="alert alert-info">
            No users available.
          </div>
          

          <div v-for="user in allUsers" :key="user.id" class="card mb-3">
            <div class="card-body d-flex justify-content-between align-items-center">
              <div>
                <strong>Email:</strong> {{ user.email }}
                <span v-if="user.active" class="badge bg-success ms-2">Active</span>
                <span v-else class="badge bg-warning ms-2">Inactive</span>
              </div>
              <div>
                <button class="btn btn-primary" v-if="!user.active" @click="approve(user.id)">
                  Approve
                </button>
                <button class="btn btn-danger" v-if="!user.is_blocked" @click="block(user.id)">
                  Block
                </button>
                <button class="btn btn-success" v-if="user.is_blocked" @click="unblock(user.id)">
                  Unblock
                </button>
              </div>
            </div>
          </div>
      </div>

      <div class="container mt-4">
        <h2 class="text-center mb-4">User Statistics</h2>
        <div class="row">
          <div class="col-md-4" v-for="(count, role) in role_counts" :key="role">
            <div class="card text-center mb-3 shadow">
              <div class="card-body">
                <h5 class="card-title">{{ role }}</h5>
                <p class="card-text display-4">{{ count }}</p>
              </div>
            </div>
          </div>
          <div class="col-md-4" v-for="(count, status) in status_counts" :key="status">
            <div class="card text-center mb-3 shadow">
              <div class="card-body">
                <h5 class="card-title">{{ status }}</h5>
                <p class="card-text display-4">{{ count }}</p>
              </div>
            </div>
          </div>
          <div class="col-md-4">
            <div class="card text-center mb-3 shadow">
              <div class="card-body">
                <h5 class="card-title">Total Users</h5>
                <p class="card-text display-4">{{ total_users }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="container mt-4">
        <h2 class="text-center mb-4">All Users</h2>
        <div v-if="allUsers.length === 0" class="alert alert-info">
          No users available.
        </div>
        <div v-else>
          <table class="table table-bordered table-hover">
            <thead class="thead-light">
              <tr>
                <th scope="col">User ID</th>
                <th scope="col">Name</th>
                <th scope="col">Email</th>
                <th scope="col">Role</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="user in allUsers" :key="user.id">
                <td>{{ user.id }}</td>
                <td>{{ user.fullname ? user.fullname : 'N/A' }}</td>
                <td>{{ user.email }}</td>
                <td>{{ user.roles.map(role => role.name).join(', ') }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div> 
  `,

  data() {
    return {
      allUsers: [],
      total_users: 0,
      role_counts: { Professional: 0, Customer: 0, Admin: 0 },
      status_counts: { Blocked: 0, Approved: 0 },
      token: localStorage.getItem('auth-token'),
      error: null,
      role: localStorage.getItem('role'),
    };
  },

  methods: {
    async approve(userId) {
      try {
        const res = await fetch(`/activate/inst/${userId}`, {
          headers: {
            'Authentication-Token': this.token,
          },
        });
        const data = await res.json();

        if (res.ok) {
          alert(data.message);
          this.allUsers = this.allUsers.map(user =>
            user.id === userId ? { ...user, active: true } : user
          );
        } else {
          this.error = data.message || 'Failed to approve user.';
        }
      } catch (error) {
        this.error = 'Error occurred while approving user.';
      }
    },

    async block(userId) {
      try {
        const res = await fetch(`/block/inst/${userId}`, {
          method: 'POST',
          headers: {
            'Authentication-Token': this.token,
          },
        });
        const data = await res.json();

        if (res.ok) {
          alert(data.message);
          this.allUsers = this.allUsers.map(user =>
            user.id === userId ? { ...user, is_blocked: true } : user
          );
        } else {
          this.error = data.message || 'Failed to block user.';
        }
      } catch (error) {
        this.error = 'Error occurred while blocking user.';
      }
    },

    async unblock(userId) {
      try {
        const res = await fetch(`/unblock/inst/${userId}`, {
          method: 'POST',
          headers: {
            'Authentication-Token': this.token,
          },
        });
        const data = await res.json();

        if (res.ok) {
          alert(data.message);
          this.allUsers = this.allUsers.map(user =>
            user.id === userId ? { ...user, is_blocked: false } : user
          );
        } else {
          this.error = data.message || 'Failed to unblock user.';
        }
      } catch (error) {
        this.error = 'Error occurred while unblocking user.';
      }
    },
  },


  async mounted() {
    try {
      const res = await fetch('/users', {
        headers: {
          'Authentication-Token': this.token,
        },
      });
      const data = await res.json();
  
      console.log(data); // Log the entire response to inspect its structure
  
      if (res.ok) {
        this.allUsers = data.users;
        this.total_users = data.total_users; 
        this.role_counts = data.role_counts; 
        this.status_counts = data.status_counts; // Ensure this is being set correctly
      } else {
        this.error = `Error: ${res.status}`;
      }
    } catch (error) {
      this.error = 'Error fetching user data.';
    }
  },
  
};
