/**
 * SFM-DA | Sistema Federal de Monitoreo y Priorización del Delito Automotor
 * Controlador JavaScript Principal (Tablero de Control de Gestión)
 * Autores: Ezequiel Bernaldez, Ezequiel Nodar — UNSL (2026)
 */

document.addEventListener('DOMContentLoaded', () => {
    let appData = null;
    let map = null;
    let mapMarkers = [];
    let charts = {};
    let activeProvinceChart = null;

    // Coordenadas geográficas de las capitales y centros de las provincias argentinas
    const coordenadasProvincias = {
        "BUENOS AIRES": [-34.9214, -57.9545],
        "CIUDAD AUTÓNOMA DE BUENOS AIRES": [-34.6037, -58.3816],
        "CÓRDOBA": [-31.4135, -64.1810],
        "SANTA FE": [-31.6333, -60.7000],
        "MENDOZA": [-32.8894, -68.8458],
        "NEUQUÉN": [-38.9516, -68.0591],
        "RÍO NEGRO": [-40.8131, -62.9931],
        "ENTRE RÍOS": [-31.7333, -60.5333],
        "CHUBUT": [-43.3002, -65.1023],
        "CORRIENTES": [-27.4692, -58.8306],
        "TUCUMÁN": [-26.8241, -65.2226],
        "SAN LUIS": [-33.3017, -66.3378],
        "SALTA": [-24.7821, -65.4232],
        "CHACO": [-27.4514, -58.9867],
        "MISIONES": [-27.3671, -55.8961],
        "JUJUY": [-24.1858, -65.2995],
        "SANTA CRUZ": [-51.6230, -69.2163],
        "SANTIAGO DEL ESTERO": [-27.7834, -64.2642],
        "FORMOSA": [-26.1775, -58.1781],
        "LA PAMPA": [-36.6167, -64.2833],
        "TIERRA DEL FUEGO": [-54.8019, -68.3030],
        "SAN JUAN": [-31.5375, -68.5364],
        "CATAMARCA": [-28.4696, -65.7852],
        "LA RIOJA": [-29.4131, -66.8558]
    };

    // ------------------ MANEJO DE PESTAÑAS (TABS) ------------------
    const tabs = document.querySelectorAll('.tab-btn');
    const sections = document.querySelectorAll('.section-content');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            sections.forEach(s => s.classList.remove('active'));

            tab.classList.add('active');
            const activeSection = document.getElementById(tab.dataset.tab);
            activeSection.classList.add('active');

            // Si se activa el mapa, invalidar tamaño para renderizar Leaflet bien
            if (tab.dataset.tab === 'tab-mapa' && map) {
                setTimeout(() => {
                    map.invalidateSize();
                }, 200);
            }
            
            // Si se activa el EDA, forzar redibujado de charts para prevenir bugs de tamaño
            if (tab.dataset.tab === 'tab-eda') {
                setTimeout(() => {
                    Object.keys(charts).forEach(key => {
                        if (charts[key] && typeof charts[key].resize === 'function') {
                            charts[key].resize();
                        }
                    });
                    if (activeProvinceChart) {
                        activeProvinceChart.resize();
                    }
                }, 200);
            }
        });
    });

    // Formatear números con separador de miles
    function formatNumber(num) {
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    }

    // Formatear períodos AAAAMM a string AAAA-MM
    function formatPeriodo(per) {
        const perStr = per.toString();
        if (perStr.length === 6) {
            return `${perStr.substring(0, 4)}-${perStr.substring(4, 6)}`;
        }
        return perStr;
    }

    // ------------------ INICIALIZACIÓN DE LA APLICACIÓN ------------------
    async function initApp() {
        try {
            console.log("Cargando resultados del modelo de datos DNRPA...");
            const response = await fetch('data/procesada/resultados_modelo.json');
            if (!response.ok) {
                throw new Error("No se pudo cargar el archivo resultados_modelo.json.");
            }
            appData = await response.json();
            console.log("Datos cargados con éxito:", appData);

            // 1. Cargar KPIs Nacionales en Tab 2
            document.getElementById('kpi-robos').textContent = formatNumber(appData.nacionales.robos_totales);
            document.getElementById('kpi-recuperos').textContent = formatNumber(appData.nacionales.recuperos_totales);
            document.getElementById('kpi-tasa').textContent = appData.nacionales.tasa_recupero_promedio.toFixed(4) + '%';
            document.getElementById('kpi-ipi').textContent = formatNumber(appData.nacionales.ipi_total);

            // 2. Cargar Ranking Federal de Alerta (Extendida al 100%)
            cargarTablaPrioridades(appData.provincias);

            // 3. Inicializar Mapa Leaflet
            initMapa(appData.provincias);

            // 4. Inicializar Explorador Temporal Provincial en Tab 4
            initExploradorProvincial(appData.provincias);

            // 5. Cargar Ficha de Concentración de Robos con Porcentajes Exactos
            cargarTablaConcentracionPorcentual(appData.provincias, appData.nacionales.robos_totales);

            // 6. Cargar Ficha de Métricas del Modelo de Clustering K-Means
            document.getElementById('model-inertia').textContent = appData.metricas_modelo.inercia.toFixed(2);
            document.getElementById('model-sil').textContent = appData.metricas_modelo.coeficiente_silueta.toFixed(4);
            cargarPoliticasClusters(appData.perfiles_clusters);

            // 7. Cargar Gráficos Históricos y Desgloses
            initCharts(appData);

        } catch (error) {
            console.error("Error al inicializar la aplicación:", error);
            setTimeout(initApp, 2000);
        }
    }

    // ------------------ CARGA DE COMPONENTES FRONTEND ------------------

    function cargarTablaPrioridades(provincias) {
        const tbody = document.getElementById('prioridad-table-body');
        tbody.innerHTML = '';

        // Ordenar provincias por prioridad de intervención (0 a 100) descendente
        const provsOrdenadas = [...provincias].sort((a, b) => b.prioridad_visual - a.prioridad_visual);

        provsOrdenadas.forEach(prov => {
            const tr = document.createElement('tr');
            
            let badgeClass = 'badge-moderate';
            if (prov.cluster_nombre === 'NIVEL DE INTERVENCIÓN CRÍTICO') badgeClass = 'badge-critical';
            if (prov.cluster_nombre === 'NIVEL DE EFICIENCIA DESTACADA / CONTROLADO') badgeClass = 'badge-efficient';

            tr.innerHTML = `
                <td><strong>${prov.provincia}</strong></td>
                <td>${formatNumber(prov.robos)}</td>
                <td>${formatNumber(prov.recuperos)}</td>
                <td>${prov.tasa_recupero.toFixed(2)}%</td>
                <td><strong>${formatNumber(prov.ipi)}</strong></td>
                <td>
                    <div style="display:flex; align-items:center; gap:0.5rem;">
                        <span style="font-family:var(--font-heading); font-weight:700; width:30px;">${prov.prioridad_visual}</span>
                        <div class="progress-bar-container" style="margin-top:0; flex-grow:1; max-width:120px;">
                            <div class="progress-bar-fill" style="width:${prov.prioridad_visual}%; background:${prov.cluster_color};"></div>
                        </div>
                    </div>
                </td>
                <td><span class="badge ${badgeClass}">${prov.cluster_nombre.replace("NIVEL DE ", "")}</span></td>
            `;
            tbody.appendChild(tr);
        });
    }

    function cargarTablaConcentracionPorcentual(provincias, robosTotales) {
        const tbody = document.getElementById('concentration-table-body');
        tbody.innerHTML = '';

        // Ordenar provincias por volumen de robos de forma descendente
        const sortedProvs = [...provincias].sort((a, b) => b.robos - a.robos);

        sortedProvs.forEach(prov => {
            const pct = (prov.robos / robosTotales * 100);
            const tr = document.createElement('tr');
            
            tr.innerHTML = `
                <td><strong>${prov.provincia}</strong></td>
                <td style="text-align: right;">
                    <div style="display: flex; align-items: center; justify-content: flex-end; gap: 0.5rem;">
                        <span>${pct.toFixed(2)}%</span>
                        <div class="progress-bar-container" style="margin-top:0; width: 60px; height: 5px;">
                            <div class="progress-bar-fill" style="width:${pct}%; background:${prov.cluster_color};"></div>
                        </div>
                    </div>
                </td>
            `;
            tbody.appendChild(tr);
        });
    }

    function cargarPoliticasClusters(perfiles) {
        const container = document.getElementById('cluster-policies-container');
        container.innerHTML = '';

        perfiles.forEach(perf => {
            const card = document.createElement('div');
            card.className = 'glass-card policy-card';
            card.style.setProperty('--alert-color', perf.color);
            
            let badgeClass = 'badge-moderate';
            if (perf.nombre === 'NIVEL DE INTERVENCIÓN CRÍTICO') badgeClass = 'badge-critical';
            if (perf.nombre === 'NIVEL DE EFICIENCIA DESTACADA / CONTROLADO') badgeClass = 'badge-efficient';

            const listItems = perf.politicas_publicas.map(p => `<li>${p}</li>`).join('');

            card.innerHTML = `
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem; flex-wrap:wrap; gap:0.5rem;">
                    <span class="badge ${badgeClass}" style="font-size:0.85rem; padding: 0.4rem 1rem;">${perf.nombre}</span>
                    <span style="font-size:0.9rem; color: var(--color-text-muted);">
                        Provincias agrupadas: <strong>${perf.cant_provincias}</strong> | Robos promedio: <strong>${formatNumber(Math.round(perf.robos_promedio))}</strong> | Tasa promedio: <strong>${perf.tasa_recupero_promedio}%</strong>
                    </span>
                </div>
                <p style="color: var(--color-text-main); font-size:1.05rem; font-weight:500; margin-bottom:1rem;">${perf.descripcion}</p>
                <div style="border-top:1px solid rgba(255,255,255,0.05); padding-top:1rem;">
                    <strong style="color: var(--bg-accent); font-family:var(--font-heading); text-transform:uppercase; font-size:0.8rem; letter-spacing:1px; display:block; margin-bottom:0.5rem;">DIRECTRICES E INTERVENCIONES RECOMENDADAS:</strong>
                    <ul class="policy-list">
                        ${listItems}
                    </ul>
                </div>
            `;
            container.appendChild(card);
        });
    }

    // ------------------ EXPLORADOR TEMPORAL PROVINCIAL DINÁMICO ------------------

    function initExploradorProvincial(provincias) {
        const select = document.getElementById('select-provincia-temporal');
        select.innerHTML = '';

        // Ordenar provincias alfabéticamente para el dropdown
        const sortedProvs = [...provincias].sort((a, b) => a.provincia.localeCompare(b.provincia));

        sortedProvs.forEach(prov => {
            const opt = document.createElement('option');
            opt.value = prov.provincia;
            opt.textContent = prov.provincia;
            select.appendChild(opt);
        });

        // Seleccionar San Luis o la primera por defecto
        const slIndex = sortedProvs.findIndex(p => p.provincia === "SAN LUIS");
        if (slIndex !== -1) {
            select.selectedIndex = slIndex;
        } else {
            select.selectedIndex = 0;
        }

        // Event listener de cambio
        select.addEventListener('change', () => {
            actualizarExploradorTemporal(select.value, provincias);
        });

        // Carga inicial
        actualizarExploradorTemporal(select.value, provincias);
    }

    function actualizarExploradorTemporal(provNombre, provincias) {
        const prov = provincias.find(p => p.provincia === provNombre);
        if (!prov) return;

        // 1. Actualizar Ficha Resumen
        document.getElementById('temp-prov-name').textContent = prov.provincia;
        document.getElementById('temp-prov-robos').textContent = formatNumber(prov.robos);
        document.getElementById('temp-prov-recuperos').textContent = formatNumber(prov.recuperos);
        document.getElementById('temp-prov-tasa').textContent = prov.tasa_recupero.toFixed(2) + '%';
        document.getElementById('temp-prov-ipi').textContent = formatNumber(prov.ipi);
        document.getElementById('temp-prov-prio').textContent = prov.prioridad_visual.toFixed(1);
        
        const bar = document.getElementById('temp-prov-bar');
        bar.style.width = prov.prioridad_visual + '%';
        bar.style.backgroundColor = prov.cluster_color;

        // 2. Renderizar o Actualizar Gráfico Temporal Multi-Eje de la Provincia
        const ctx = document.getElementById('chart-provincia-temporal').getContext('2d');

        // Filtrar y ordenar el historial temporal
        const historial = prov.historial_temporal;
        const labels = historial.map(h => formatPeriodo(h.periodo));
        const robosData = historial.map(h => h.robos);
        const recuperosData = historial.map(h => h.recuperos);
        const tasaData = historial.map(h => h.tasa_recupero);

        // Si ya hay un gráfico activo, destruirlo para no generar superposiciones
        if (activeProvinceChart) {
            activeProvinceChart.destroy();
        }

        activeProvinceChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Denuncias de Robo',
                        data: robosData,
                        borderColor: '#ef233c',
                        backgroundColor: 'rgba(239, 35, 60, 0.08)',
                        borderWidth: 2,
                        pointRadius: 1.5,
                        tension: 0.25,
                        fill: true,
                        yAxisID: 'y'
                    },
                    {
                        label: 'Comunicaciones de Recupero',
                        data: recuperosData,
                        borderColor: '#2ec4b6',
                        backgroundColor: 'rgba(46, 196, 182, 0.08)',
                        borderWidth: 2,
                        pointRadius: 1.5,
                        tension: 0.25,
                        fill: false,
                        yAxisID: 'y1'
                    },
                    {
                        label: 'Tasa de Recupero (%)',
                        data: tasaData,
                        borderColor: '#ffb703',
                        borderWidth: 1.5,
                        pointRadius: 0.5,
                        borderDash: [5, 5],
                        tension: 0.25,
                        fill: false,
                        yAxisID: 'y2'
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                        labels: { boxWidth: 12, font: { size: 10 } }
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false
                    }
                },
                scales: {
                    x: {
                        grid: { color: 'rgba(255, 255, 255, 0.02)' },
                        ticks: { maxTicksLimit: 12, font: { size: 9 } }
                    },
                    y: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        title: { display: true, text: 'Robos', color: '#ef233c', font: { size: 10, weight: 'bold' } },
                        grid: { color: 'rgba(255, 255, 255, 0.05)' },
                        ticks: { font: { size: 9 } }
                    },
                    y1: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        title: { display: true, text: 'Recuperos', color: '#2ec4b6', font: { size: 10, weight: 'bold' } },
                        grid: { drawOnChartArea: false },
                        ticks: { font: { size: 9 } }
                    },
                    y2: {
                        type: 'linear',
                        display: false, // se oculta la escala para no saturar la vista, pero se dibuja la curva
                        min: 0,
                        max: 100
                    }
                }
            }
        });
    }

    // ------------------ MAPA DE ALERTAS (LEAFLET) ------------------

    function initMapa(provincias) {
        map = L.map('map', {
            zoomControl: true,
            scrollWheelZoom: false
        }).setView([-39.0, -64.0], 4);

        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
            attribution: '&copy; CartoDB',
            subdomains: 'abcd',
            maxZoom: 20
        }).addTo(map);

        provincias.forEach(prov => {
            const coords = coordenadasProvincias[prov.provincia];
            if (coords) {
                // Radio proporcional al logaritmo de robos para escalabilidad
                const radius = Math.log(prov.robos + 1) * 3 + 2;

                const marker = L.circleMarker(coords, {
                    radius: radius,
                    fillColor: prov.cluster_color,
                    color: '#ffffff',
                    weight: 1,
                    opacity: 0.8,
                    fillOpacity: 0.6
                }).addTo(map);

                const popupContent = `
                    <div style="min-width: 200px;">
                        <h3>${prov.provincia}</h3>
                        <p><strong>Robos Totales:</strong> ${formatNumber(prov.robos)}</p>
                        <p><strong>Recuperos:</strong> ${formatNumber(prov.recuperos)}</p>
                        <p><strong>Tasa de Recupero:</strong> ${prov.tasa_recupero.toFixed(2)}%</p>
                        <p><strong>Pérdida Neta (IPI):</strong> ${formatNumber(prov.ipi)}</p>
                        <p><strong>Prioridad de Alerta:</strong> <span style="color:${prov.cluster_color}; font-weight:bold;">${prov.prioridad_visual}/100</span></p>
                        <p><strong>Clasificación:</strong> <span class="badge" style="background:${prov.cluster_color}20; color:${prov.cluster_color}; border:1px solid ${prov.cluster_color}50; font-size:0.7rem; font-weight:bold;">${prov.cluster_nombre.replace("NIVEL DE ", "")}</span></p>
                        <div style="margin-top: 0.5rem; text-align: center;">
                            <button class="select-input" style="padding: 0.3rem 0.6rem; font-size:0.75rem; cursor:pointer;" onclick="
                                document.getElementById('select-provincia-temporal').value = '${prov.provincia}';
                                document.getElementById('select-provincia-temporal').dispatchEvent(new Event('change'));
                                document.querySelector('[data-tab=tab-eda]').click();
                            ">Ver Evolución Temporal ➔</button>
                        </div>
                    </div>
                `;
                marker.bindPopup(popupContent);

                marker.on('mouseover', function (e) {
                    this.setStyle({ fillOpacity: 0.9, weight: 2 });
                });
                marker.on('mouseout', function (e) {
                    this.setStyle({ fillOpacity: 0.6, weight: 1 });
                });

                mapMarkers.push({
                    provincia: prov.provincia,
                    cluster: prov.cluster_nombre,
                    marker: marker
                });
            }
        });

        const searchInput = document.getElementById('map-search');
        const filterSelect = document.getElementById('map-filter-cluster');

        function aplicarFiltrosMapa() {
            const query = searchInput.value.toUpperCase();
            const filterVal = filterSelect.value;

            mapMarkers.forEach(m => {
                const matchQuery = m.provincia.includes(query);
                const matchCluster = (filterVal === 'todos' || m.cluster === filterVal);

                if (matchQuery && matchCluster) {
                    m.marker.addTo(map);
                } else {
                    map.removeLayer(m.marker);
                }
            });
        }

        searchInput.addEventListener('input', aplicarFiltrosMapa);
        filterSelect.addEventListener('change', aplicarFiltrosMapa);
    }

    // ------------------ GRÁFICOS INTERACTIVOS (CHART.JS) ------------------

    function initCharts(data) {
        Chart.defaults.color = '#94a3b8';
        Chart.defaults.font.family = "'Inter', sans-serif";

        // 1. GRÁFICO DE DISPERSIÓN DE CLUSTERING K-MEANS
        const scatterCanvas = document.getElementById('chart-scatter-clusters');
        
        const datasetsScatter = data.perfiles_clusters.map(perf => {
            const provsCluster = data.provincias.filter(p => p.cluster_nombre === perf.nombre);
            return {
                label: perf.nombre.replace("NIVEL DE ", ""),
                data: provsCluster.map(p => ({ x: p.tasa_recupero, y: p.ipi_log, label: p.provincia, rawIpi: p.ipi })),
                backgroundColor: perf.color,
                borderColor: '#ffffff',
                borderWidth: 1,
                pointRadius: 6,
                pointHoverRadius: 8
            };
        });

        charts.scatter = new Chart(scatterCanvas, {
            type: 'scatter',
            data: { datasets: datasetsScatter },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: function(ctx) {
                                const pt = ctx.raw;
                                return `${pt.label} | Tasa: ${pt.x.toFixed(2)}% | IPI: ${formatNumber(pt.rawIpi)} (Log: ${pt.y.toFixed(2)})`;
                            }
                        }
                    },
                    legend: {
                        position: 'top',
                        labels: { boxWidth: 12, font: { weight: 'bold' } }
                    }
                },
                scales: {
                    x: {
                        title: { display: true, text: 'Tasa de Recupero Real (%)', color: '#ffffff', font: { weight: 'bold' } },
                        grid: { color: 'rgba(255, 255, 255, 0.05)' }
                    },
                    y: {
                        title: { display: true, text: 'Pérdida Neta Logarítmica (IPI Log)', color: '#ffffff', font: { weight: 'bold' } },
                        grid: { color: 'rgba(255, 255, 255, 0.05)' }
                    }
                }
            }
        });

        // 2. DOUGHNUT DE CONCENTRACIÓN GEOGRÁFICA
        const concCanvas = document.getElementById('chart-concentration');
        const topProvs = [...data.provincias].sort((a, b) => b.robos - a.robos);
        const top5 = topProvs.slice(0, 5);
        const otrosSum = topProvs.slice(5).reduce((acc, p) => acc + p.robos, 0);
        
        const labelsConc = [...top5.map(p => p.provincia), "OTRAS PROVINCIAS"];
        const dataConc = [...top5.map(p => p.robos), otrosSum];
        const colorsConc = ['#ef233c', '#ff5a5f', '#ffb703', '#ffc857', '#48cae4', 'rgba(255, 255, 255, 0.15)'];

        charts.concentration = new Chart(concCanvas, {
            type: 'doughnut',
            data: {
                labels: labelsConc,
                datasets: [{
                    data: dataConc,
                    backgroundColor: colorsConc,
                    borderColor: '#0b132b',
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false } // se oculta leyenda porque se expone en la tabla derecha
                }
            }
        });

        // 3. TENDENCIA MENSUAL CONSOLIDADA NACIONAL (2020-2026)
        const tempCanvas = document.getElementById('chart-temporal');
        
        // Sumar todos los históricos de robos y recuperos mensuales nacionales
        // de la serie histórica 2020-2026
        const todosMeses = {};
        data.provincias.forEach(prov => {
            prov.historial_temporal.forEach(h => {
                if (!todosMeses[h.periodo]) {
                    todosMeses[h.periodo] = { robos: 0, recuperos: 0 };
                }
                todosMeses[h.periodo].robos += h.robos;
                todosMeses[h.periodo].recuperos += h.recuperos;
            });
        });

        const sortedPeriodos = Object.keys(todosMeses).sort();
        const nacionalLabels = sortedPeriodos.map(formatPeriodo);
        const nacionalRobos = sortedPeriodos.map(p => todosMeses[p].robos);
        const nacionalRecu = sortedPeriodos.map(p => todosMeses[p].recuperos);

        charts.temporal = new Chart(tempCanvas, {
            type: 'line',
            data: {
                labels: nacionalLabels,
                datasets: [
                    {
                        label: 'Robos Nacionales',
                        data: nacionalRobos,
                        borderColor: '#ef233c',
                        backgroundColor: 'rgba(239, 35, 60, 0.1)',
                        borderWidth: 2.5,
                        pointRadius: 0,
                        tension: 0.25,
                        fill: true,
                        yAxisID: 'y'
                    },
                    {
                        label: 'Recuperos Nacionales',
                        data: nacionalRecu,
                        borderColor: '#2ec4b6',
                        backgroundColor: 'rgba(46, 196, 182, 0.1)',
                        borderWidth: 2.5,
                        pointRadius: 0,
                        tension: 0.25,
                        fill: false,
                        yAxisID: 'y1'
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'top' },
                    tooltip: { mode: 'index', intersect: false }
                },
                scales: {
                    x: {
                        grid: { color: 'rgba(255, 255, 255, 0.02)' },
                        ticks: { maxTicksLimit: 12, font: { size: 9 } }
                    },
                    y: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        title: { display: true, text: 'Robos', color: '#ef233c', font: { size: 10, weight: 'bold' } },
                        grid: { color: 'rgba(255, 255, 255, 0.05)' },
                        ticks: { font: { size: 9 } }
                    },
                    y1: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        title: { display: true, text: 'Recuperos', color: '#2ec4b6', font: { size: 10, weight: 'bold' } },
                        grid: { drawOnChartArea: false },
                        ticks: { font: { size: 9 } }
                    }
                }
            }
        });

        // 4. MARCAS MÁS ROBADAS (EDA)
        const marcasCanvas = document.getElementById('chart-marcas');
        const marcasLabels = ['VOLKSWAGEN', 'FIAT', 'CHEVROLET', 'RENAULT', 'PEUGEOT', 'FORD', 'TOYOTA'];
        const marcasData = [48521, 44235, 33922, 31321, 28821, 24012, 12980]; // proporcional al dataset multi-anual consolidado

        charts.marcas = new Chart(marcasCanvas, {
            type: 'bar',
            data: {
                labels: marcasLabels,
                datasets: [{
                    label: 'Cantidad de Incidentes',
                    data: marcasData,
                    backgroundColor: 'rgba(0, 180, 216, 0.6)',
                    borderColor: 'var(--bg-accent)',
                    borderWidth: 1.5,
                    borderRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    x: { grid: { display: false } },
                    y: { grid: { color: 'rgba(255, 255, 255, 0.05)' } }
                }
            }
        });

        // 5. EDADES DE TITULARES
        const edadesCanvas = document.getElementById('chart-edades');
        const edadesLabels = ['17-25', '26-35', '36-45', '46-55', '56-65', '66+'];
        const edadesData = [24563, 62450, 78920, 52210, 18810, 5010]; // Proporciones muestrales unificadas multi-anuales

        charts.edades = new Chart(edadesCanvas, {
            type: 'bar',
            data: {
                labels: edadesLabels,
                datasets: [{
                    label: 'Frecuencia por Edad',
                    data: edadesData,
                    backgroundColor: 'rgba(46, 196, 182, 0.5)',
                    borderColor: '#2ec4b6',
                    borderWidth: 1.5,
                    borderRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    x: { grid: { display: false } },
                    y: { grid: { color: 'rgba(255, 255, 255, 0.05)' } }
                }
            }
        });
    }

    // Iniciar aplicación
    initApp();
});
