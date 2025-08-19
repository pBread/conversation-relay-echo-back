import Fastify from "fastify";
import fastifyFormbody from "@fastify/formbody";
import fastifyWs from "@fastify/websocket";

const fastify = Fastify();
fastify.register(fastifyFormbody);
fastify.register(fastifyWs);

const { HOSTNAME, PORT = 3000 } = process.env;
