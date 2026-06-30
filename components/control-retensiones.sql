-- rebate.merchant definition
CREATE TABLE `company` (
    `id` uuid primary key default gen_random_uuid (),
    `create_time` datetime DEFAULT NULL,
    `update_time` datetime DEFAULT NULL,
    `delete_time` datetime DEFAULT NULL,
    `name` varchar(255) NOT NULL,
    `address` varchar(255) DEFAULT NULL,
    `city` varchar(50) DEFAULT NULL,
    `postcode` varchar(50) DEFAULT NULL,
    `phone_number` varchar(50) DEFAULT NULL,
    `state` varchar(50) DEFAULT NULL,
    `soft_delete` tinyint(1) DEFAULT NULL,
    `country` varchar(50) DEFAULT NULL,
)

insert into
    company (
        name,
        address,
        city,
        postcode,
        phone_number,
        state,
        soft_delete,
        country
    )
values (
        'Casa del Panadero',
        'Calle 1',
        'Ciudad',
        '12345',
        '555-1234',
        'Comayagua',
        0,
        'Honduras'
    );

CREATE TABLE `merchant` (
    `id` uuid primary key default gen_random_uuid (),
    `parent_id` int DEFAULT NULL,
    `create_time` datetime DEFAULT NULL,
    `update_time` datetime DEFAULT NULL,
    `delete_time` datetime DEFAULT NULL,
    `nickname` varchar(255) NOT NULL,
    `address` varchar(255) DEFAULT NULL,
    `city` varchar(50) DEFAULT NULL,
    `postcode` varchar(50) DEFAULT NULL,
    `phone_number` varchar(50) DEFAULT NULL,
    `state` varchar(50) DEFAULT NULL,
    `soft_delete` tinyint(1) DEFAULT NULL,
    `country` varchar(50) DEFAULT NULL,
    `status` varchar(50) DEFAULT NULL,
)

insert into
    merchant (
        nickname,
        address,
        city,
        postcode,
        phone_number,
        state,
        soft_delete,
        country,
        status
    )
values (
        'Negocio 1',
        'Calle 2',
        'Ciudad',
        '12345',
        '555-5678',
        'Comayagua',
        0,
        'Honduras',
        'activo'
    ),
    (
        'Negocio 2',
        'Calle 3',
        'Ciudad',
        '12345',
        '555-9012',
        'Comayagua',
        0,
        'Honduras',
        'activo'
    );

CREATE TABLE `distributor` (
    `id` uuid primary key default gen_random_uuid (),
    `parent_id` uuid DEFAULT NULL,
    `create_time` datetime DEFAULT NULL,
    `update_time` datetime DEFAULT NULL,
    `delete_time` datetime DEFAULT NULL,
    `nickname` varchar(255) NOT NULL,
    `address` varchar(255) DEFAULT NULL,
    `city` varchar(50) DEFAULT NULL,
    `postcode` varchar(50) DEFAULT NULL,
    `phone_number` varchar(50) DEFAULT NULL,
    `state` varchar(3) DEFAULT NULL,
    `soft_delete` tinyint(1) DEFAULT NULL,
    `country` varchar(50) DEFAULT NULL,
    `status` varchar(50) DEFAULT NULL,
)

insert into
    distributor (
        nickname,
        address,
        city,
        postcode,
        phone_number,
        state,
        soft_delete,
        country,
        status
    )
values (
        'Distribuidor 1',
        'Calle 4',
        'Ciudad',
        '12345',
        '555-3456',
        'Comayagua',
        0,
        'Honduras',
        'activo'
    ),
    (
        'Distribuidor 2',
        'Calle 5',
        'Ciudad',
        '12345',
        '555-7890',
        'Comayagua',
        0,
        'Honduras',
        'activo'
    );

create table cais (
    id uuid primary key default gen_random_uuid (),
    cai_id text not null,
    distributor_id uuid not null references distributor (id) on delete restrict,
    bloque text, -- ej. "Retenciones 2026"
    merchant_id uuid not null references merchant (id) on delete restrict,
    company_id uuid not null references company (id) on delete restrict,
    start_from text not null, -- ej. 000-001-01-00000001
    end_from text not null, -- ej. 000-001-01-00000500
    emission_date date not null,
    expiration_date date not null,
    status text not null default 'activo',
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    deleted_at timestamptz,
    constraint cai_valid_status check (
        status in (
            'activo',
            'vencido',
            'agotado',
            'anulado'
        )
    ),
    constraint cai_valid_dates check (
        expiration_date >= emission_date
    )
);

create table retenciones (
    id uuid primary key default gen_random_uuid (),
    retencion_id text not null, -- ej. 000-001-01-00000251
    merchant_id uuid not null references merchant (id) on delete restrict,
    cai_id uuid not null references cais (id) on delete restrict,
    no_factura text not null, -- ej. 001-002-03-00012345
    date date,
    amount numeric(14, 2) not null default 0,
    retain_amount numeric(14, 2) not null default 0,
    user_id uuid references auth.users (id) on delete set null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    deleted_at timestamptz,
    constraint montos_no_negativos check (
        amount >= 0
        and retain_amount >= 0
    )
);