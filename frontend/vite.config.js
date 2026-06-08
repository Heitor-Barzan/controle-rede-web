import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

export default defineConfig({
    plugins: [vue()],
    resolve: {
        alias: {
            "@": fileURLToPath(new URL("./src", import.meta.url)),
        },
    },
    server: {
        proxy: {
            "/login": "http://localhost:7000",
            "/cadastro": "http://localhost:7000",
            "/disciplinas": "http://localhost:7000",
            "/sync": "http://localhost:7000",
            "/init": "http://localhost:7000",
        },
    },
});
