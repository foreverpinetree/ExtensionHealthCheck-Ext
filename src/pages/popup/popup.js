import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";
import "buefy/dist/buefy.css";
import Buefy from "buefy";

import '../colors.scss'; // Import custom colors

// Create the Vue app
const app = createApp(App);

// Use router
app.use(router);
app.use(Buefy, {
	defaultIconPack: "fas", // Use Font Awesome icons
});

// Register global filters as methods in Vue 3
app.config.globalProperties.$filters = {
	toTime(value) {
		if (!value) return "";
		value = new Date(value).toLocaleString();
		return value;
	},
	capitalizeFirstLetter(string) {
		return string.charAt(0).toUpperCase() + string.slice(1);
	},
};

// Mount the app
app.mount("#popup");
