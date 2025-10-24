'use client'; // 👈 IMPORTANTE: Define como Componente Cliente

import React, { useState, useEffect } from 'react';

// --- TIPAGEM (Opcional, mas recomendado para TypeScript) ---
interface ClientDetails {
  os: string;
  browser: string;
  deviceType: string;
  resolution: string;
  ipAddress: string;
  location: string;
  isp: string;
  timezone: string;
  localTime: string;
  utcTime: string;
  statusMessage: string;
  statusClass: 'loading' | 'success' | 'error';
}

// NOVO URL da API de geolocalização
const API_URL = 'https://ipinfo.io/json'; 

// --- Funções de Detecção (Adaptadas para fora do componente ou dentro do useEffect) ---
// É melhor manter as funções que usam o 'window' fora da renderização inicial.

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

// --- Componente Principal ---

export default function AccessDetailsPage() {
    // Estado inicial com valores de "carregando"
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

    // Função para atualização de horário
    const updateTime = (timezone?: string) => {
        const now = new Date();
        const formattedTimeUTC = now.toLocaleTimeString('pt-BR', { timeZone: 'UTC' }) + ' UTC';

        let formattedLocalTime = 'Não disponível';
        if (timezone) {
            try {
                formattedLocalTime = now.toLocaleTimeString('pt-BR', {
                    timeZone: timezone,
                    hour: '2-digit', minute: '2-digit', second: '2-digit'
                });
            } catch (e) { /* ignore */ }
        }

        setDetails(prev => ({
            ...prev,
            utcTime: formattedTimeUTC,
            localTime: formattedLocalTime
        }));
    };


    // useEffect substitui window.onload, rodando a lógica após a montagem do componente
    useEffect(() => {
        const { os, browser } = getBrowserAndOS();
        const deviceType = getDeviceType();
        const resolution = getScreenResolution();

        // 1. Carrega dados do cliente (S.O., Browser, etc.)
        setDetails(prev => ({ ...prev, os, browser, deviceType, resolution }));

        // 2. Inicia o relógio UTC e o mantém atualizado
        const timezone = details.timezone === '...' ? undefined : details.timezone;
        updateTime(timezone); 
        const intervalId = setInterval(() => updateTime(details.timezone), 1000);

        // 3. Obtém Geolocalização e a envia para o DB
        async function getGeolocationDetails() {
            try {
                const response = await fetch(API_URL); 
                const data = await response.json();

                if (data.ip && data.ip !== 'bogon') { 
                    const newTimezone = data.timezone;
                    const geoData = {
                        ipAddress: data.ip,
                        location: `${data.city}, ${data.region}, ${data.country}`,
                        isp: data.org || 'N/A',
                        timezone: newTimezone,
                    };

                    setDetails(prev => ({ 
                        ...prev, 
                        ...geoData,
                        statusMessage: 'Informações obtidas com sucesso!',
                        statusClass: 'success',
                    }));
                    
                    // IMPORTANTE: Aqui chamamos a API Route (Route Handler) para salvar no DB!
                    const dbPayload = {
                        ip_address: data.ip,
                        cidade: data.city,
                        pais: data.country,
                        isp: data.org || 'N/A',
                        fuso_horario: newTimezone,
                        sistema_operacional: os,
                        navegador: browser,
                        tipo_dispositivo: deviceType,
                        resolucao_tela: resolution
                    };

                    await fetch('/api/record-access', { 
                        method: 'POST', 
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(dbPayload)
                    });

                } else {
                    setDetails(prev => ({ 
                        ...prev, 
                        statusMessage: 'Erro ao obter dados: Limite da API atingido ou IP inválido.',
                        statusClass: 'error',
                    }));
                    console.error('Dados da API:', data);
                }

            } catch (error) {
                console.error('Erro na requisição da API/DB:', error);
                setDetails(prev => ({ 
                    ...prev, 
                    statusMessage: 'Erro de rede ou falha na requisição da API/DB.',
                    statusClass: 'error',
                }));
            }
        }

        getGeolocationDetails();

        // Cleanup: Limpa o intervalo de tempo quando o componente é desmontado
        return () => clearInterval(intervalId);

    }, [details.timezone]); // Re-executa o efeito se o timezone mudar (quando a geo-localização carrega)

    // O JSX (HTML do index.html)
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