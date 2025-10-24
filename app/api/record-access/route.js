// app/api/record-access/route.js

import { Client } from 'pg';
import { NextResponse } from 'next/server';

// O Route Handler para o método POST
export async function POST(request) {
  // 1. Configuração do Cliente PG (mantida a mesma lógica)
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      // Necessário para conexões com o Neon/Postgres
      rejectUnauthorized: false,
    },
  });

  try {
    // 2. Conectar ao Banco de Dados
    await client.connect();
    
    // 3. Obter os dados do corpo da requisição (usando request.json() em vez de req.body)
    const data = await request.json(); 

    // Comando SQL para inserção dos dados
    const query = `
      INSERT INTO acessos (
        ip_address, cidade, pais, isp, fuso_horario,
        sistema_operacional, navegador, tipo_dispositivo, resolucao_tela
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9
      )
    `;
    
    // Valores a serem inseridos no DB
    const values = [
      data.ip_address,
      data.cidade,
      data.pais,
      data.isp,
      data.fuso_horario,
      data.sistema_operacional,
      data.navegador,
      data.tipo_dispositivo,
      data.resolucao_tela
    ];

    await client.query(query, values);

    // 4. Retorno de Sucesso (usando NextResponse.json em vez de res.status().json())
    return NextResponse.json(
      { message: 'Acesso registrado com sucesso.' }, 
      { status: 201 }
    );

  } catch (error) {
    console.error('Erro ao inserir no banco de dados:', error);
    
    // 5. Retorno de Erro (usando NextResponse.json em vez de res.status().json())
    return NextResponse.json(
      { message: 'Erro interno do servidor.', error: error.message }, 
      { status: 500 }
    );
  } finally {
    // 6. Finalização da Conexão
    if (client) {
      await client.end();
    }
  }
}