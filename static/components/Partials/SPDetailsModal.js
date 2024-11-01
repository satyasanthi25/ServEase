export default ({
    data: () => ({
        bootstrap_modal: {},
        servicepackageInfo: {
            service: '',
            requests: []
        },
    }),
    methods: {
        markAsFavorite(package_id){
            fetch('/api/package/mark_as_fav/' + package_id, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authentication-Token': localStorage.getItem('auth-token')  // Flask auth token here
                },
                method: 'GET',
            }).then(async (res) => {
                this.getSPDetails(package_id)
            })
        },
        viewModal(servicepackage) {
            this.servicepackageInfo = servicepackage
            this.getSPDetails(servicepackage.package_id)
            this.bootstrap_modal.show()
        },
        getSPDetails(package_id) {
            fetch('/api/package/' + package_id, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authentication-Token': localStorage.getItem('auth-token')  // Flask auth token here
                },
                method: 'GET',
            }).then(async (res) => {
                if (res.ok) {
                    this.servicepackageInfo = await res.json()
                }
            })
        },
        approveServicePackage(request_id) {
            fetch('/api/approve-request/' + request_id, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authentication-Token': localStorage.getItem('auth-token')  // Flask auth token here
                }
            }).then((res) => {
                if (res.ok) {
                    this.getServiceDetails(this.servicepackageInfo.package_id)
                }
            })
        },
        closeServicePackage(request_id) {
            fetch('/api/close-request/' + request_id, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authentication-Token': localStorage.getItem('auth-token')  // Flask auth token here
                }
            }).then((res) => {
                if (res.ok) {
                    this.getSPDetails(this.servicepackageInfo.package_id)
                }
            })
        },
        requestServicePackage(package_id) {
            fetch(`/api/request-service/${package_id}`, {
                headers: {
                    'Authentication-Token': localStorage.getItem('auth-token')
                }
            }).then(async (res) => {
                if (res.ok) {
                    this.getServicePackageDetails(package_id)
                }
            })
        },
    },
    mounted() {
        this.bootstrap_modal = new bootstrap.Modal(document.getElementById('viewSPDetailsModal'));
    },
    computed: {
        role() {
            return localStorage.getItem('role')
        },
        imagePath: function () {
            if (this.servicepackageInfo.hasOwnProperty('image')) {
                if (this.servicepackageInfo.image == "") {
                    return "static/images/c.jpg";
                } else {
                    return "static/uploaded/" + this.servicepackageInfo.image;
                }
            } else {
                return ''
            }
        }
    },
    template: `
        <!-- Modal -->
<div>
    <div class="modal fade" id="viewSPDetailsModal" tabindex="-1" aria-labelledby="viewSPDetailsModalLabel"
         aria-hidden="true">
        <div class="modal-dialog modal-xl">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title" id="viewSPDetailsModalLabel">Package Details</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                    <div class="row">
                        <div class="col-lg-5 text-center mx-auto">
                            <div class="mx-auto">
                                <img class="mx-auto" :alt="servicepackageInfo.package_name" style="max-width: 100%; height: 500px"
                                     :src="imagePath"/>
                            </div>
                        </div>

                        <div class="col-lg-7">
                        <div class="clearfix">
                            <div class="float-start">
                                 <h2>
                                    {{ servicepackageInfo.package_name }}
                                </h2>
                            </div>
                            <div class="float-end"  v-if="role=='admin'">
                                <router-link class="text-white" :to="'/edit-package/'+servicepackageInfo.package_id">
                                    <button class="btn btn-primary" data-bs-dismiss="modal" >
                                        Edit
                                    </button>
                                </router-link>
                            </div>
                        </div>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" @click="markAsFavorite(servicepackageInfo.package_id)">Mark this Service as Favorite</button>
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                </div>
            </div>
        </div>
    </div>
</div>
    `,
});
