import Home from './components/Home.js';
import Login from "./components/Login.js";
import CustomerRegister from './components/CustomerRegister.js';
import ProfessionalRegister from './components/ProfessionalRegister.js';
import AllServices from './components/AllServices.js';
import EditService from './components/EditService.js';
import MyRequests from './components/MyRequests.js';
import ViewService from './components/ViewService.js';
import profile from './components/profile.js';
import Professionals from './components/Professionals.js';
import Users from './components/Users.js';
import ServiceRequestForm from './components/ServiceRequestForm.js';
import AllRequests from './components/AllRequests.js';
import ClosedServices from './components/ClosedServices.js';
import SearchResult from './components/SearchResult.js';
import AdminStats from './components/AdminStats.js';
import MyServices from './components/MyServices.js';
import EditRequest from './components/EditRequest.js';
import ViewCustomerRequests from './components/ViewCustomerRequests.js';
import SimilarLocation from './components/SimilarLocation.js';
import AvailableServices from './components/AvailableServices.js';




const routes = [
    {path: "/", component: Home, name: "Home"},
    {path: "/user-login", component: Login, name: "Login"},
    {path: "/customer-register",component:CustomerRegister, name: "CustomerRegister"},
    {path: "/sp-register",component: ProfessionalRegister, name: "ProfessionalRegister"},
    {path: "/services", component: AllServices, name: "AllServices"},
    {path: "/edit-service/:id", component: EditService, name: "EditService"},
    {path: "/my-requests", component: MyRequests, name: "MyRequests"},
    {path: "/service/:id", component: ViewService, name: "ViewService"},
    {path: "/profile", component: profile, name: "Profile"},
    {path: "/professionals", component: Professionals, name: "Professionals"},
    {path: "/service-requests", component: ServiceRequestForm, name: "ServiceRequestForm"},
    {path: "/users", component: Users, name: "Users"},
    {path: "/admin/all-requests", component: AllRequests, name: "AllRequests"},
    {path: "/cust-services",component: AvailableServices,name:"AvailableServices"},
    { path: "/prof/all-requests", component: ViewCustomerRequests, name: "ViewCustomerRequests"},
    { path: "/closed-services", component: ClosedServices, name: "ClosedServices"},  
    { path: '/admin-stats', component: AdminStats, name: 'AdminStats' },
    { path: '/my-services', component: MyServices, name: 'MyServices' },
    { path: '/service-requests/:id',name: 'EditRequest',component: EditRequest },
    { path: '/professionals/similar_location',name : 'SimilarLocation',component: SimilarLocation},
    { path:'/search-result', component: SearchResult, name: 'SearchResult'},
    
      
    
     
];

const router = new VueRouter({
    routes,

});

router.beforeEach((to, from, next) => {
    let isLoggedIn = localStorage.getItem("auth-token");
    let role = localStorage.getItem("role");  // Fetch role from localStorage
    const loginPages = ["CustomerRegister", "ProfessionalRegister", "Login"];
    
    if (loginPages.includes(to.name)) {
        if(isLoggedIn){
            next({name:"Home"})
        }else {
            next()
        }
    }else {
        if(isLoggedIn){
            next()
        }else{
            next({name:"Login"})
        }
    }
});
export default router;