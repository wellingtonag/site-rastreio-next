'use client'; 

import React, { useState, useEffect, useCallback } from 'react';

// ====================================================================
// --- TIPAGEM DE DADOS (TypeScript) ---
// ====================================================================
interface ClientDetails {
  os: string;
  browser: string;
  deviceType: string;
  resolution: string;
  ipAddress: string;
  location: string;
  isp: string;
  timezone: string | undefined;
  localTime: string;
  utcTime: string;
  statusMessage: string;
  statusClass: 'loading' | 'success' | 'error';
}

const API_URL = 'https://ipinfo.io/json'; 

// ====================================================================
// --- FUNÇÕES DE DETECÇÃO DO CLIENTE (JavaScript Puro) ---
// ====================================================================

function getBrowserAndOS() {
    const userAgent = window.navigator.userAgent;
    let os = 'Desconhecido';
    let browser = 'Desconhecido';

    // 1. Detectar SO
    if (/Win/.test(userAgent)) os = 'Windows';
    else if (/Mac/.test(userAgent)) os = 'macOS';
    else if (/Linux/.test(userAgent)) os = 'Linux';
    else if (/Android/.test(userAgent)) os = 'Android';
    else if (/iPhone|iPad|iPod/.test(userAgent)) os = 'iOS';
    
    // 2. Detectar Navegador
    if (userAgent.indexOf("Chrome") !== -1 && userAgent.indexOf("Edg") === -1) browser = 'Chrome';
    else if (userAgent.indexOf("Firefox") !== -1) browser = 'Firefox';
    else if (userAgent.indexOf("Edg") !== -1) browser = 'Edge';
    else if (userAgent.indexOf("Safari") !== -1 && userAgent.indexOf("Chrome") === -1) browser = 'Safari';
    else if (userAgent.indexOf("MSIE") !== -1 || userAgent.indexOf("Trident") !== -1) browser = 'IE';
    
    return { os, browser };
}

function getDeviceType() {
    const userAgent = window.navigator.userAgent.toLowerCase();
    
    if (/(tablet|ipad|playbook|silk)|(android(?!.*mobile))/i.test(userAgent)) {
        return "Tablet";
    }
    if (/mobile|iphone|ipod|blackberry|opera mini|windows phone|iemobile|android/i.test(userAgent)) {
        return "Celular";
    }
    return "Desktop/Laptop";
}

function getScreenResolution() {
    return `${window.screen.width}x${window.screen.height}`;
}


// ====================================================================
// --- COMPONENTE PRINCIPAL ---
// ====================================================================

export default function AccessDetailsPage() {
    
    const [details, setDetails] = useState<ClientDetails>({
        os: '...',
        browser: '...',
        deviceType: '...',
        resolution: '...',
        ipAddress: '...',
        location: '...',
        isp: '...',
        timezone: '...',
        localTime: '...',
        utcTime: '...',
        statusMessage: 'Buscando informações...',
        statusClass: 'loading',
    });
    
    // Usamos useCallback para garantir que esta função de atualização não mude a cada renderização.
    const updateTime = useCallback((timezone: string | undefined) => {
        const now = new Date();
        const formattedTimeUTC = now.toLocaleTimeString('pt-BR', { 
            timeZone: 'UTC', 
            hour: '2-digit', 
            minute: '2-digit', 
            second: '2-digit' 
        }) + ' UTC';

        let formattedLocalTime = 'Não disponível';
        if (timezone && timezone !== '...') {
            try {
                formattedLocalTime = now.toLocaleTimeString('pt-BR', {
                    timeZone: timezone,
                    hour: '2-digit', minute: '2-digit', second: '2-digit'
                });
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            } catch (e) { /* Fuso Inválido */ }
        }

        setDetails(prev => ({
            ...prev,
            utcTime: formattedTimeUTC,
            localTime: formattedLocalTime
        }));
    }, []); // A função só é criada uma vez


    // useEffect roda na montagem do componente, substituindo window.onload
    useEffect(() => {
        // 1. DADOS DO CLIENTE OBTIDOS IMEDIATAMENTE (Variáveis Locais)
        const clientData = {
            os: getBrowserAndOS().os,
            browser: getBrowserAndOS().browser,
            deviceType: getDeviceType(),
            resolution: getScreenResolution(),
        };

        let geoTimezone: string = 'N/A'; // Inicializa como string

        // 2. FUNÇÃO ASSÍNCRONA para Geolocalização e DB
        async function getGeolocationAndDBDetails() {
            try {
                // Requisição da Geolocalização
                const response = await fetch(API_URL); 
                const data = await response.json();

                if (data.ip && data.ip !== 'bogon') { 
                    geoTimezone = data.timezone; // Aqui será uma string válida
                    
                    // --- ATUALIZAÇÃO ÚNICA DO ESTADO (Consolida Dados do Cliente + Geo) ---
                    setDetails(prev => ({ 
                        ...prev, 
                        ...clientData, // Dados do Cliente
                        
                        // Dados da Geolocalização
                        ipAddress: data.ip,
                        location: `${data.city}, ${data.region}, ${data.country}`,
                        isp: data.org || 'N/A',
                        timezone: geoTimezone, // Agora é garantido ser uma string

                        // Status
                        statusMessage: 'Informações obtidas com sucesso!',
                        statusClass: 'success',
                    }));
                    
                    // 3. Chamada da API Route para o DB (usando clientData)
                    const dbPayload = {
                        ip_address: data.ip,
                        cidade: data.city,
                        pais: data.country,
                        isp: data.org || 'N/A',
                        fuso_horario: geoTimezone,
                        sistema_operacional: clientData.os, 
                        navegador: clientData.browser,
                        tipo_dispositivo: clientData.deviceType,
                        resolucao_tela: clientData.resolution
                    };

                    await fetch('/api/record-access', { 
                        method: 'POST', 
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(dbPayload)
                    });

                } else {
                    // ATUALIZAÇÃO DE ERRO
                    setDetails(prev => ({ 
                        ...prev, 
                        ...clientData,
                        statusMessage: 'Erro ao obter dados: Limite da API atingido ou IP inválido.',
                        statusClass: 'error',
                    }));
                }

            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            } catch (error) {
                // ATUALIZAÇÃO DE ERRO GERAL
                setDetails(prev => ({ 
                    ...prev, 
                    ...clientData,
                    statusMessage: 'Erro de rede ou falha na requisição da API/DB.',
                    statusClass: 'error',
                }));
            }
        }

        getGeolocationAndDBDetails();

        // 4. Lógica de Horário (Inicia e Mantém)
        // O intervalo é iniciado, e a função updateTime usará o timezone do estado.
        // O useCallback no updateTime evita problemas de dependência.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        updateTime(undefined); // Roda a primeira vez (só com UTC)
        const intervalId = setInterval(() => {
            // Usa o timezone que já foi definido no estado.
            updateTime(geoTimezone || details.timezone);
        }, 1000);
        
        // 5. Função de limpeza (cleanup) do useEffect
        return () => clearInterval(intervalId);

    }, [updateTime, details.timezone]); // Dependências: updateTime (garantida por useCallback) e timezone (para renderizar horário local após geolocalização)


    // ====================================================================
    // --- JSX (Conteúdo Visual do index.html) ---
    // ====================================================================
    return (
        <div className="container">
            <h1>🔎 Informações Detalhadas do Acesso</h1>
            <div id="status" className={details.statusClass}>
                {details.statusMessage}
            </div>

            <h2>🌐 Geolocalização e IP</h2>
            <div className="info-item"><strong>Endereço IP:</strong> <span id="ip-address">{details.ipAddress}</span></div>
            <div className="info-item"><strong>Localização (Cidade, País):</strong> <span id="location">{details.location}</span></div>
            <div className="info-item"><strong>Provedor (ISP):</strong> <span id="isp">{details.isp}</span></div>
            <div className="info-item"><strong>Fuso Horário (API):</strong> <span id="timezone">{details.timezone}</span></div>

            <h2>🕰️ Horários</h2>
            <div className="info-item"><strong>Horário do Servidor (UTC):</strong> <span id="current-utc-time">{details.utcTime}</span></div>
            <div className="info-item"><strong>Horário Atual (Local do IP):</strong> <span id="current-local-time">{details.localTime}</span></div>
            
            <h2>💻 Cliente (Navegador/Dispositivo)</h2>
            <div className="info-item"><strong>Sistema Operacional:</strong> <span id="os-name">{details.os}</span></div>
            <div className="info-item"><strong>Navegador:</strong> <span id="browser-name">{details.browser}</span></div>
            <div className="info-item"><strong>Tipo de Dispositivo:</strong> <span id="device-type">{details.deviceType}</span></div>
            <div className="info-item"><strong>Resolução da Tela:</strong> <span id="screen-resolution">{details.resolution}</span></div>
        </div>
    );
}