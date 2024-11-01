export default {
  template: `
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
              UnBlock
            </button>
            
          </div>
        </div>
      </div>
    </div>
  `,

  data() {
    return {
      allUsers: [],
      token: localStorage.getItem('auth-token'),
      error: null,
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
          // Optionally, update the user status to 'blocked' locally
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
          // Optionally, update the user status to 'blocked' locally
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
//fetching data automatically
  async mounted() {
    try {
      const res = await fetch('/users', {
        headers: {
          'Authentication-Token': this.token,
        },
      });
      const data = await res.json();

      if (res.ok) {
        this.allUsers = data;
      } else {
        this.error = `Error: ${res.status}`;
      }
    } catch (error) {
      this.error = 'Error fetching user data.';
    }
  },
};
