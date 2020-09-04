import * as $ from '../utils/$';

type Modal = HTMLElement & {
    show: () => void;
    hide: () => void;
};

export default ({ template }: { template: () => string }): Modal => {
    const modal = $.frag(template()) as Modal;

    modal.show = () => modal.classList.add('is-active');
    modal.hide = () => modal.classList.remove('is-active');

    $.all(modal, '.trigger-close').map((elem) =>
        $.on(elem, 'click', modal.hide),
    );

    return modal;
};
