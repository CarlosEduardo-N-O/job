import { useEffect, useState } from 'react';

import api from '../../services/api';

import {
    criarPublicacao,
    atualizarPublicacao,
} from '../../services/publicacaoService';

import usePublicacaoControle from './publicacaoControle';

import '../../styles/publicacoes.css';

export default function PublicacaoForm({
    publicacao,
    onClose,
    onSaved,
}) {
    const {
        modoEdicao,
        categorias,
        formulario,
        carregando,
        salvando,
        erro,
        handleChange,
        handleSubmit,
        fechar,
    } = usePublicacaoControle({
        publicacao,
        onClose,
        onSaved,
    });

    return (
        <div
            className="publicacao-modal-overlay"
            onMouseDown={(event) => {
                if (
                    event.target === event.currentTarget &&
                    !salvando
                ) {
                    fechar();
                }
            }}
        >
            <div className="publicacao-modal">

                <div className="publicacao-modal-header">
                    <div>
                        <h2>
                            {modoEdicao
                                ? 'Editar publicação'
                                : 'Nova publicação'}
                        </h2>

                        <p>
                            {modoEdicao
                                ? 'Atualize os dados do serviço.'
                                : 'Preencha os dados do serviço.'}
                        </p>
                    </div>

                    <button
                        type="button"
                        className="publicacao-modal-fechar"
                        onClick={fechar}
                        disabled={salvando}
                        aria-label="Fechar"
                    >
                        ×
                    </button>
                </div>

                {erro && (
                    <div className="publicacao-modal-erro">
                        {erro}
                    </div>
                )}

                {carregando ? (
                    <div className="publicacao-modal-loading">
                        Carregando...
                    </div>
                ) : (
                    <form
                        className="publicacao-modal-form"
                        onSubmit={handleSubmit}
                    >

                        <div className="publicacao-modal-campo">
                            <label htmlFor="categoria_id">
                                Categoria
                            </label>

                            <select
                                id="categoria_id"
                                name="categoria_id"
                                value={formulario.categoria_id}
                                onChange={handleChange}
                                required
                            >
                                <option value="">
                                    Selecione uma categoria
                                </option>

                                {categorias.map((categoria) => (
                                    <option
                                        key={categoria.id}
                                        value={categoria.id}
                                    >
                                        {categoria.nome}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="publicacao-modal-campo">
                            <label htmlFor="titulo">
                                Título
                            </label>

                            <input
                                id="titulo"
                                name="titulo"
                                type="text"
                                value={formulario.titulo}
                                onChange={handleChange}
                                placeholder="Ex.: Instalação elétrica"
                                maxLength={255}
                                required
                            />
                        </div>

                        <div className="publicacao-modal-campo">
                            <label htmlFor="descricao">
                                Descrição
                            </label>

                            <textarea
                                id="descricao"
                                name="descricao"
                                value={formulario.descricao}
                                onChange={handleChange}
                                placeholder="Descreva o serviço..."
                                rows={5}
                                required
                            />
                        </div>

                        <div className="publicacao-modal-grid">

                            <div className="publicacao-modal-campo">
                                <label htmlFor="valor_estimado">
                                    Valor estimado
                                </label>

                                <input
                                    id="valor_estimado"
                                    name="valor_estimado"
                                    type="number"
                                    value={formulario.valor_estimado}
                                    onChange={handleChange}
                                    placeholder="0,00"
                                    min="0"
                                    step="0.01"
                                />
                            </div>

                            <div className="publicacao-modal-campo">
                                <label htmlFor="data_inicio">
                                    Data de início
                                </label>

                                <input
                                    id="data_inicio"
                                    name="data_inicio"
                                    type="date"
                                    value={formulario.data_inicio}
                                    onChange={handleChange}
                                />
                            </div>

                        </div>

                        <div className="publicacao-modal-grid">

                            <div className="publicacao-modal-campo">
                                <label htmlFor="cidade">
                                    Cidade
                                </label>

                                <input
                                    id="cidade"
                                    name="cidade"
                                    type="text"
                                    value={formulario.cidade}
                                    onChange={handleChange}
                                    placeholder="Ex.: Rio do Sul"
                                    maxLength={255}
                                    required
                                />
                            </div>

                            <div className="publicacao-modal-campo">
                                <label htmlFor="estado">
                                    Estado
                                </label>

                                <input
                                    id="estado"
                                    name="estado"
                                    type="text"
                                    value={formulario.estado}
                                    onChange={handleChange}
                                    placeholder="SC"
                                    maxLength={2}
                                    required
                                />
                            </div>

                        </div>

                        <div className="publicacao-modal-campo">
                            <label htmlFor="endereco_servico">
                                Endereço do serviço
                            </label>

                            <input
                                id="endereco_servico"
                                name="endereco_servico"
                                type="text"
                                value={formulario.endereco_servico}
                                onChange={handleChange}
                                placeholder="Rua, número, bairro..."
                                maxLength={255}
                            />
                        </div>

                        <div className="publicacao-modal-grid">

                            <div className="publicacao-modal-campo">
                                <label htmlFor="horario_inicio">
                                    Horário de início
                                </label>

                                <input
                                    id="horario_inicio"
                                    name="horario_inicio"
                                    type="time"
                                    value={formulario.horario_inicio}
                                    onChange={handleChange}
                                />
                            </div>

                            <div className="publicacao-modal-campo">
                                <label htmlFor="data_fim">
                                    Data de término
                                </label>

                                <input
                                    id="data_fim"
                                    name="data_fim"
                                    type="date"
                                    value={formulario.data_fim}
                                    onChange={handleChange}
                                />
                            </div>

                        </div>

                        <div className="publicacao-modal-acoes">

                            <button
                                type="button"
                                className="publicacao-modal-btn-cancelar"
                                onClick={fechar}
                                disabled={salvando}
                            >
                                Fechar
                            </button>

                            <button
                                type="submit"
                                className="publicacao-modal-btn-salvar"
                                disabled={salvando}
                            >
                                {salvando
                                    ? 'Salvando...'
                                    : modoEdicao
                                      ? 'Salvar alterações'
                                      : 'Publicar serviço'}
                            </button>

                        </div>

                    </form>
                )}

            </div>
        </div>
    );
}