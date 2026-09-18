import PublicacaoCard from './PublicacaoCard';
import PublicacaoForm from './PublicacaoForm';

export default function Publicacao({
    publicacao,
    onInteracao,

    // Props utilizadas pelo formulário
    modo = 'card',
    onClose,
    onSaved,
}) {
    if (modo === 'form') {
        return (
            <PublicacaoForm
                publicacao={publicacao}
                onClose={onClose}
                onSaved={onSaved}
            />
        );
    }

    return (
        <PublicacaoCard
            publicacao={publicacao}
            onInteracao={onInteracao}
        />
    );
}