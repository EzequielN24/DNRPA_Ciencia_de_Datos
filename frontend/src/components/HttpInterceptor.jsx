import React, { useEffect } from 'react';
import api from '../services/api';

const HttpInterceptor = ({ children }) => {
    useEffect(() => {
        const interceptorPeticion = api.interceptors.request.use(
            (configuracion) => {
                console.log(`Petición iniciada hacia: ${configuracion.url}`);
                return configuracion;
            },
            (error) => {
                console.error("Error en la petición:", error);
                return Promise.reject(error);
            }
        );

        const interceptorRespuesta = api.interceptors.response.use(
            (respuesta) => {
                console.log(`Respuesta recibida desde: ${respuesta.config.url}`);
                return respuesta;
            },
            (error) => {
                console.error("Error en la respuesta:", error);
                return Promise.reject(error);
            }
        );

        // Limpieza al desmontar
        return () => {
            api.interceptors.request.eject(interceptorPeticion);
            api.interceptors.response.eject(interceptorRespuesta);
        };
    }, []);

    return <>{children}</>;
};

export default HttpInterceptor;
